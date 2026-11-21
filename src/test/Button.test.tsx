import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Button from '../components/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Go</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps the label of a ghost button (e.g. "Sign out") on one line, even in a narrow header', () => {
    render(<Button variant="ghost">Sign out</Button>)
    const classes = screen.getByRole('button', { name: 'Sign out' }).className.split(/\s+/)
    expect(classes).toContain('whitespace-nowrap') // no wrapping into a two-line pill
    expect(classes).toContain('shrink-0') // a flex row cannot squeeze it narrower than its label
  })

  it.each(['ghost', 'quiet'] as const)('sizes a %s button to its label instead of stretching', (variant) => {
    render(<Button variant={variant}>Child Mode</Button>)
    const classes = screen.getByRole('button', { name: 'Child Mode' }).className.split(/\s+/)
    expect(classes).toContain('w-auto')
    // No full-width or centring classes that a width utility would have to fight against.
    expect(classes).not.toContain('w-full')
    expect(classes).not.toContain('mx-auto')
    expect(classes).not.toContain('max-w-4xl')
  })

  it.each(['primary', 'secondary'] as const)('keeps a %s button full width', (variant) => {
    render(<Button variant={variant}>Go</Button>)
    expect(screen.getByRole('button').className.split(/\s+/)).toContain('w-full')
  })

  it('fills its parent, without a maximum width, when fullWidth is set', () => {
    render(<Button variant="secondary" fullWidth>Add</Button>)
    const classes = screen.getByRole('button').className.split(/\s+/)
    expect(classes).toContain('w-full')
    expect(classes).toContain('max-w-none')
    expect(classes).not.toContain('max-w-4xl')
  })

  it('renders an arrow for secondary variant', () => {
    render(<Button variant="secondary">Next</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('→')
  })

  it('does not render arrow for primary variant', () => {
    render(<Button variant="primary">Save</Button>)
    expect(screen.getByRole('button')).not.toHaveTextContent('→')
  })
})
