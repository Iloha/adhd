import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ErrorBanner from '../components/ErrorBanner'
import LoadingState from '../components/LoadingState'
import RouteError from '../components/RouteError'

describe('ErrorBanner', () => {
  it('renders the message as an alert', () => {
    render(<ErrorBanner message="Failed to add task." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to add task.')
  })

  it('renders nothing without a message', () => {
    const { container } = render(<ErrorBanner message={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LoadingState', () => {
  it('shows the default label as a status', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks...')
  })

  it('accepts a custom label', () => {
    render(<LoadingState label="Please wait" />)
    expect(screen.getByRole('status')).toHaveTextContent('Please wait')
  })
})

describe('RouteError', () => {
  it('shows the error message and retries on click', async () => {
    const reset = vi.fn()
    render(<RouteError error={new Error('Boom')} reset={reset} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByText('Boom')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
