import { render } from '@testing-library/react'
import { AppContext } from '../context/AppContext'

export function renderWithContext(ui, contextValue = {}) {
  const defaults = {
    mode: 'child',
    setMode: () => {},
    activeTaskId: null,
    setActiveTaskId: () => {},
  }
  const value = { ...defaults, ...contextValue }
  return render(<AppContext.Provider value={value}>{ui}</AppContext.Provider>)
}
