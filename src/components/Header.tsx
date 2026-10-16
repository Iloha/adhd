import type { Child } from "../types"

/** Shows whose tasks these are: the child's avatar and name. */
function Header({ child }: { child?: Pick<Child, 'name' | 'avatar'> | null }) {
  if (!child) return null

  return (
    <header className="flex items-center justify-center gap-3 pt-6 text-gray-900">
      {child.avatar && <span aria-hidden className="text-4xl">{child.avatar}</span>}
      <h1 className="text-2xl font-bold">{child.name}</h1>
    </header>
  )
}

export default Header
