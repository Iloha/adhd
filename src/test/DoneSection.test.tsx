import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import DoneSection from '../components/DoneSection'

const toggle = () => screen.getByRole('button', { name: /^done \(/i })

beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('DoneSection', () => {
  it('is closed by default and hides its tasks', () => {
    render(<DoneSection count={2} childId="c1"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveTextContent('Done (2)')
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Done list')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no done tasks', () => {
    render(<DoneSection count={0} childId="c1"><p>Done list</p></DoneSection>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('opens and closes with a click', async () => {
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    await userEvent.click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Done list')).toBeInTheDocument()
    await userEvent.click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Done list')).not.toBeInTheDocument()
  })

  it('works with the keyboard: Enter and Space toggle it', async () => {
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    await userEvent.tab()
    expect(toggle()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(' ')
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('points aria-controls at the region it shows and hides', () => {
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    expect(document.getElementById(toggle().getAttribute('aria-controls')!)).toBeInTheDocument()
  })

  it('remembers that it was opened, after a reload', async () => {
    const { unmount } = render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    await userEvent.click(toggle())
    unmount()
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Done list')).toBeInTheDocument()
  })

  it('remembers that it was closed again', async () => {
    const { unmount } = render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    await userEvent.click(toggle())
    await userEvent.click(toggle())
    unmount()
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('remembers open/closed separately for each child', async () => {
    const { rerender } = render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    await userEvent.click(toggle())
    rerender(<DoneSection count={1} childId="c2"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    rerender(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    render(<DoneSection count={1} childId="c1"><p>Done list</p></DoneSection>)
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle())
    expect(screen.getByText('Done list')).toBeInTheDocument()
  })
})
