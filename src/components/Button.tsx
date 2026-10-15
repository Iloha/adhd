"use client"

import type { ReactNode } from 'react'

interface ButtonProps {
  text?: string
  children?: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

function Button({ text, children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }: ButtonProps) {
  // base styles tuned for a large, centered call-to-action button (matches screenshot)
  const base = 'inline-flex items-center justify-center w-full max-w-4xl mx-auto px-10 py-4 rounded-2xl text-lg font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 min-h-14'
  const variants: Record<string, string> = {
    // primary: large green pill with strong shadow and uppercase text
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-500 shadow-lg uppercase',
    // secondary: large blue CTA with shadow and trailing arrow (matches screenshot)
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400 shadow-lg uppercase',
    // ghost: small outlined pill (no shadow), intended for header/inline use
    ghost: 'bg-white text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-300 shadow-none normal-case w-auto max-w-none min-h-12 px-5 py-2 rounded-full text-base font-medium border border-blue-300',
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
