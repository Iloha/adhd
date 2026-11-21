import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from '../components/Header'

const child = { name: 'Alex', avatar: '🦊' }

describe('Header', () => {
  it('shows the name without stars when no star count is given', () => {
    render(<Header child={child} />)
    expect(screen.getByRole('heading', { name: 'Alex' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/star/i)).not.toBeInTheDocument()
  })

  it('shows the star count', () => {
    render(<Header child={child} stars={12} />)
    expect(screen.getByLabelText('12 stars')).toBeInTheDocument()
  })

  it('uses the singular for one star and shows 0 stars', () => {
    const { rerender } = render(<Header child={child} stars={1} />)
    expect(screen.getByLabelText('1 star')).toBeInTheDocument()
    rerender(<Header child={child} stars={0} />)
    expect(screen.getByLabelText('0 stars')).toBeInTheDocument()
  })
})
