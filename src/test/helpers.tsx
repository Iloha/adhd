import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { AppContext } from '../context/AppContext'

export function renderWithContext(ui: ReactElement, contextValue: Partial<{ activeTaskId: string | null; setActiveTaskId: (id: string | null) => void }> = {}) {
  const defaults = {
    activeTaskId: null,
    setActiveTaskId: () => {},
  }
  const value = { ...defaults, ...contextValue }
  return render(<AppContext.Provider value={value}>{ui}</AppContext.Provider>)
}
