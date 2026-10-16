"use client"

import type { Child } from "../types"

interface ChildSwitcherProps {
  children: Child[]
  selectedChildId: string | null
  onSelect: (id: string) => void
  onManage: () => void
}

/** Chips for choosing whose tasks the parent is looking at. */
function ChildSwitcher({ children: childProfiles, selectedChildId, onSelect, onManage }: ChildSwitcherProps) {
  return (
    <nav aria-label="Children" className="mt-4 flex flex-wrap items-center gap-2">
      {childProfiles.map((child) => (
        <button
          key={child.id}
          type="button"
          aria-pressed={child.id === selectedChildId}
          onClick={() => onSelect(child.id)}
          className={`flex items-center gap-2 min-h-12 px-4 rounded-full border text-base font-medium ${
            child.id === selectedChildId
              ? 'bg-blue-700 border-blue-700 text-white'
              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
          }`}
        >
          {child.avatar && <span aria-hidden>{child.avatar}</span>}
          {child.name}
        </button>
      ))}
      <button
        type="button"
        onClick={onManage}
        className="min-h-12 px-4 rounded-full text-base font-medium text-blue-700 hover:bg-blue-50"
      >
        {childProfiles.length === 0 ? '+ Add a child' : 'Manage children'}
      </button>
    </nav>
  )
}

export default ChildSwitcher
