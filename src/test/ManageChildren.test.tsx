import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ManageChildren from '../components/ManageChildren'
import ChildSwitcher from '../components/ChildSwitcher'

const kids = [
  { id: 'c1', name: 'Alex', avatar: '🦊' },
  { id: 'c2', name: 'Sam', avatar: '🐼' },
]

function setup(overrides = {}) {
  const props = {
    children: kids,
    onAdd: vi.fn().mockResolvedValue(true),
    onRename: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
  render(<ManageChildren {...props} />)
  return props
}

describe('ManageChildren', () => {
  it('adds a child with the chosen avatar', async () => {
    const props = setup()
    await userEvent.type(screen.getByLabelText('Name'), 'Robin')
    await userEvent.click(screen.getByRole('button', { name: 'Avatar 🐯' }))
    await userEvent.click(screen.getByRole('button', { name: /add child/i }))
    expect(props.onAdd).toHaveBeenCalledWith('Robin', '🐯')
    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  it('does not allow adding a child with a blank name', () => {
    setup()
    expect(screen.getByRole('button', { name: /add child/i })).toBeDisabled()
  })

  it('renames a child', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Rename Alex' }))
    const input = screen.getByLabelText('New name for Alex')
    await userEvent.clear(input)
    await userEvent.type(input, 'Alexander')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(props.onRename).toHaveBeenCalledWith('c1', 'Alexander')
  })

  it('asks for confirmation before deleting, and warns that tasks go too', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Sam' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/all of their tasks/i)
    expect(props.onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }))
    expect(props.onDelete).toHaveBeenCalledWith('c2')
  })

  it('keeps the child when the deletion is cancelled', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Sam' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(props.onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ChildSwitcher', () => {
  it('marks the selected child and selects another on click', async () => {
    const onSelect = vi.fn()
    render(<ChildSwitcher children={kids} selectedChildId="c1" onSelect={onSelect} onManage={() => {}} />)
    expect(screen.getByRole('button', { name: /alex/i })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: /sam/i }))
    expect(onSelect).toHaveBeenCalledWith('c2')
  })

  it('offers to add a child when there are none', async () => {
    const onManage = vi.fn()
    render(<ChildSwitcher children={[]} selectedChildId={null} onSelect={() => {}} onManage={onManage} />)
    await userEvent.click(screen.getByRole('button', { name: /add a child/i }))
    expect(onManage).toHaveBeenCalled()
  })
})
