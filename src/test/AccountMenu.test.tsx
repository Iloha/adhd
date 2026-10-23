import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountMenu, { accountInitial } from '../components/AccountMenu'

const { signOut, getPinStatus, setPin, changePin } = vi.hoisted(() => ({
  signOut: vi.fn(),
  getPinStatus: vi.fn(),
  setPin: vi.fn(),
  changePin: vi.fn(),
}))
vi.mock('../app/auth/actions', () => ({ signOut }))
vi.mock('../app/parent/actions', () => ({ getPinStatus, setPin, changePin, startChildMode: vi.fn() }))

const parent = { email: 'ilona@example.com', isAnonymous: false }
const demo = { email: null, isAnonymous: true }

beforeEach(() => {
  signOut.mockReset()
  getPinStatus.mockReset().mockResolvedValue(true)
  setPin.mockReset()
  changePin.mockReset()
})

const trigger = () => screen.getByRole('button', { name: /account menu/i })

async function enterPin(pin: string) {
  for (const digit of pin) await userEvent.click(screen.getByRole('button', { name: digit }))
}

describe('accountInitial', () => {
  it('uses the first letter of the email, uppercased', () => {
    expect(accountInitial(parent)).toBe('I')
  })
  it('uses D for demo users', () => {
    expect(accountInitial(demo)).toBe('D')
  })
  it('falls back to ? without an email', () => {
    expect(accountInitial({ email: null, isAnonymous: false })).toBe('?')
  })
})

describe('AccountMenu', () => {
  it('shows an avatar with the initial and no menu until opened', () => {
    render(<AccountMenu account={parent} />)
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveTextContent('I')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows "Demo" next to a D avatar for anonymous users', () => {
    render(<AccountMenu account={demo} />)
    expect(trigger()).toHaveTextContent('Demo')
    expect(trigger()).toHaveTextContent('D')
    expect(trigger()).toHaveAccessibleName(/demo/i)
  })

  it('opens with the email, Change PIN and Sign out, focusing the first item', async () => {
    render(<AccountMenu account={parent} />)
    await userEvent.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('ilona@example.com')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['Change PIN', 'Sign out'])
    expect(screen.getByRole('menuitem', { name: 'Change PIN' })).toHaveFocus()
  })

  it('opens from the keyboard (Enter) and moves with the arrow keys', async () => {
    render(<AccountMenu account={parent} />)
    trigger().focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Change PIN' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
  })

  it('closes on Escape and returns focus to the button', async () => {
    render(<AccountMenu account={parent} />)
    await userEvent.click(trigger())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })

  it('closes when clicking outside', async () => {
    render(<div><p>outside</p><AccountMenu account={parent} /></div>)
    await userEvent.click(trigger())
    await userEvent.click(screen.getByText('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('signs out', async () => {
    render(<AccountMenu account={parent} />)
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(signOut).toHaveBeenCalled()
  })
})

describe('Change PIN', () => {
  async function openDialog(account = parent) {
    render(<AccountMenu account={account} />)
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Change PIN' }))
    return screen.findByRole('dialog', { name: /pin/i })
  }

  it('asks for the current PIN, then the new one twice, and saves', async () => {
    changePin.mockResolvedValue({ error: null })
    await openDialog()
    expect(await screen.findByText('Enter your current PIN')).toBeInTheDocument()
    await enterPin('1111')
    expect(screen.getByText('Choose a new 4-digit PIN')).toBeInTheDocument()
    await enterPin('2222')
    expect(screen.getByText('Enter the new PIN again to confirm')).toBeInTheDocument()
    await enterPin('2222')
    await waitFor(() => expect(changePin).toHaveBeenCalledWith('1111', '2222'))
    expect(await screen.findByText('Your PIN was saved.')).toBeInTheDocument()
  })

  it('starts over when the confirmation does not match, without calling the server', async () => {
    await openDialog()
    await screen.findByText('Enter your current PIN')
    await enterPin('1111')
    await enterPin('2222')
    await enterPin('3333')
    expect(await screen.findByText(/didn't match/i)).toBeInTheDocument()
    expect(screen.getByText('Enter your current PIN')).toBeInTheDocument()
    expect(changePin).not.toHaveBeenCalled()
  })

  it('shows the server error (wrong current PIN) and starts over', async () => {
    changePin.mockResolvedValue({ error: 'Wrong PIN. 4 tries left.' })
    await openDialog()
    await screen.findByText('Enter your current PIN')
    await enterPin('1111')
    await enterPin('2222')
    await enterPin('2222')
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeInTheDocument()
    expect(screen.getByText('Enter your current PIN')).toBeInTheDocument()
  })

  it('sets a first PIN when none exists', async () => {
    getPinStatus.mockResolvedValue(false)
    setPin.mockResolvedValue({ error: null })
    await openDialog()
    expect(await screen.findByText('Choose a new 4-digit PIN')).toBeInTheDocument()
    await enterPin('4444')
    await enterPin('4444')
    await waitFor(() => expect(setPin).toHaveBeenCalledWith('4444'))
    expect(changePin).not.toHaveBeenCalled()
  })

  it('closes on Escape and returns focus to the account button', async () => {
    await openDialog()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })
})
