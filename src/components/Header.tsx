import type { Child } from "../types"

interface HeaderProps {
  child?: Pick<Child, 'name' | 'avatar'> | null
  /** Shown next to the name when given (child mode). */
  stars?: number
}

/** Shows whose tasks these are: the child's avatar and name, and their stars in child mode. */
function Header({ child, stars }: HeaderProps) {
  if (!child) return null

  return (
    <header className="flex flex-wrap items-center justify-center gap-3 pt-6 text-gray-900">
      {child.avatar && <span aria-hidden className="text-4xl">{child.avatar}</span>}
      <h1 className="text-2xl font-bold">{child.name}</h1>
      {stars !== undefined && (
        <p
          aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'}`}
          className="flex items-center gap-1 rounded-full bg-amber-100 px-4 py-1 text-xl font-bold text-amber-900"
        >
          <span aria-hidden>⭐</span>
          <span aria-hidden>{stars}</span>
        </p>
      )}
    </header>
  )
}

export default Header
