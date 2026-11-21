"use client"

import type { ReactNode } from 'react'

interface ButtonProps {
  text?: string
  children?: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** Fill the whole width of the parent instead of stopping at a maximum width (large variants only). */
  fullWidth?: boolean
}

function Button({ text, children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, fullWidth = false }: ButtonProps) {
  // Shared by every variant. Width is set per variant, not here: two conflicting width
  // utilities on one element are settled by stylesheet order, so a variant could not reliably undo them.
  const base = 'inline-flex items-center justify-center rounded-2xl text-lg font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 min-h-14'
  // Large call-to-action buttons fill their row (up to a maximum) and centre themselves.
  // (mx-auto does not centre an inline-flex element, so this only matters for block parents.)
  const wide = fullWidth ? 'w-full max-w-none px-10 py-4' : 'w-full max-w-4xl mx-auto px-10 py-4'
  // Small outlined pills for headers and inline use: sized to their label, which stays on one line.
  const pill = 'w-auto min-h-12 px-5 py-2 rounded-full text-base font-medium border whitespace-nowrap shrink-0 shadow-none normal-case'
  const variants: Record<string, string> = {
    // primary: large green pill with strong shadow and uppercase text
    primary: `${wide} bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-500 shadow-lg uppercase`,
    // secondary: large blue CTA with shadow and trailing arrow
    secondary: `${wide} bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400 shadow-lg uppercase`,
    // ghost: outlined pill for the main action in a header
    ghost: `${pill} bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-300 border-blue-300`,
    // quiet: same pill in neutral grey, for a secondary action next to a ghost button (e.g. "Sign out")
    quiet: `${pill} bg-white text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300 border-gray-300`,
  }

  const variantClasses = variants[variant] ?? variants.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children ?? text}
      {variant === 'secondary' && (
        <span aria-hidden className="ml-4 text-2xl leading-none">→</span>
      )}
    </button>
  )
}

export default Button
