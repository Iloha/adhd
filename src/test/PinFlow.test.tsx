import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PinPad from '../components/PinPad'
import ParentLock from '../components/ParentLock'
import StartChildMode from '../components/StartChildMode'

const { getPinStatus, setPin, startChildMode, exitChildMode } = vi.hoisted(() => ({
  getPinStatus: vi.fn(),
  setPin: vi.fn(),
  startChildMode: vi.fn(),
  exitChildMode: vi.fn(),
}))
vi.mock('../app/parent/actions', () => ({ getPinStatus, setPin, startChildMode }))
vi.mock('../app/child/actions', () => ({ exitChildMode }))

beforeEach(() => {
  getPinStatus.mockReset()
  setPin.mockReset()
  startChildMode.mockReset()
  exitChildMode.mockReset()
})

async function enterPin(pin: string) {
  for (const digit of pin) await userEvent.click(screen.getByRole('button', { name: digit }))
}

describe('PinPad', () => {
  it('calls onComplete after 4 digits and clears itself', async () => {
    const onComplete = vi.fn()
    render(<PinPad label="Enter PIN" onComplete={onComplete} />)
    await enterPin('1234')
    expect(onComplete).toHaveBeenCalledWith('1234')
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '0 of 4 digits entered')
  })

  it('does not call onComplete before 4 digits, and backspace removes one', async () => {
    const onComplete = vi.fn()
    render(<PinPad label="Enter PIN" onComplete={onComplete} />)
    await enterPin('12')
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '2 of 4 digits entered')
    await userEvent.click(screen.getByRole('button', { name: /delete last digit/i }))
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '1 of 4 digits entered')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('accepts typed digits from the keyboard', () => {
    const onComplete = vi.fn()
    render(<PinPad label="Enter PIN" onComplete={onComplete} />)
    for (const key of '4321') fireEvent.keyDown(window, { key })
    expect(onComplete).toHaveBeenCalledWith('4321')
  })

  it('ignores input while disabled and shows an error', async () => {
    const onComplete = vi.fn()
    render(<PinPad label="Enter PIN" onComplete={onComplete} disabled error="Wrong PIN. 4 tries left." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Wrong PIN. 4 tries left.')
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
    fireEvent.keyDown(window, { key: '1' })
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('ParentLock (child screen)', () => {
  it('opens a PIN dialog and sends the PIN to the server action', async () => {
    exitChildMode.mockResolvedValue({ error: 'Wrong PIN. 4 tries left.' })
    render(<ParentLock />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /parent/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await enterPin('0000')
    expect(exitChildMode).toHaveBeenCalledWith('0000')
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong PIN. 4 tries left.')
  })

  it('closes the dialog on Cancel', async () => {
    render(<ParentLock />)
    await userEvent.click(screen.getByRole('button', { name: /parent/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('StartChildMode', () => {
  const kids = [
    { id: 'c1', name: 'Alex', avatar: '🦊' },
    { id: 'c2', name: 'Sam', avatar: '🐼' },
  ]

  it('asks for a new PIN twice the first time, then saves it', async () => {
    getPinStatus.mockResolvedValue(false)
    setPin.mockResolvedValue({ error: null })
    render(<StartChildMode children={kids} onManageChildren={() => {}} />)
    expect(await screen.findByText(/choose a 4-digit pin/i)).toBeInTheDocument()
    await enterPin('1234')
    expect(await screen.findByText(/enter the pin again/i)).toBeInTheDocument()
    await enterPin('1234')
    await waitFor(() => expect(setPin).toHaveBeenCalledWith('1234'))
    expect(await screen.findByText(/who is using it/i)).toBeInTheDocument()
  })

  it("does not save the PIN when the confirmation doesn't match", async () => {
    getPinStatus.mockResolvedValue(false)
    render(<StartChildMode children={kids} onManageChildren={() => {}} />)
    await screen.findByText(/choose a 4-digit pin/i)
    await enterPin('1234')
    await screen.findByText(/enter the pin again/i)
    await enterPin('4321')
    expect(setPin).not.toHaveBeenCalled()
    expect(await screen.findByRole('alert')).toHaveTextContent(/didn't match/i)
    expect(screen.getByText(/choose a 4-digit pin/i)).toBeInTheDocument()
  })

  it('lets the parent choose a child once a PIN exists', async () => {
    getPinStatus.mockResolvedValue(true)
    startChildMode.mockResolvedValue({ error: null })
    render(<StartChildMode children={kids} onManageChildren={() => {}} />)
    await userEvent.click(await screen.findByRole('button', { name: /sam/i }))
    expect(startChildMode).toHaveBeenCalledWith('c2')
  })

  it('shows the error returned by the server action', async () => {
    getPinStatus.mockResolvedValue(true)
    startChildMode.mockResolvedValue({ error: 'That child profile was not found.' })
    render(<StartChildMode children={kids} onManageChildren={() => {}} />)
    await userEvent.click(await screen.findByRole('button', { name: /alex/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
  })

  it('asks to add a child first when there are no profiles', async () => {
    getPinStatus.mockResolvedValue(true)
    const onManage = vi.fn()
    render(<StartChildMode children={[]} onManageChildren={onManage} />)
    await userEvent.click(await screen.findByRole('button', { name: /add a child/i }))
    expect(onManage).toHaveBeenCalled()
  })
})
