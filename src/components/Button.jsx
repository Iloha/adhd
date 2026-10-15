"use client"

function Button({ text, children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) {
  // base styles tuned for a large, centered call-to-action button (matches screenshot)
  const base = 'inline-flex items-center justify-center w-full max-w-4xl mx-auto px-10 py-4 rounded-2xl text-lg font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants = {
    // primary: large green pill with strong shadow and uppercase text
    primary: 'bg-emerald-500 text-white hover:bg-emerald-400 focus:ring-emerald-400 shadow-lg uppercase',
    // secondary: large blue CTA with shadow and trailing arrow (matches screenshot)
    secondary: 'bg-blue-500 text-white hover:bg-blue-400 focus:ring-blue-400 shadow-lg uppercase',
    // ghost: small outlined pill (no shadow), intended for header/inline use
    ghost: 'bg-white text-blue-600 hover:bg-blue-50 focus:ring-blue-200 shadow-none normal-case w-auto max-w-none px-4 py-2 rounded-full text-sm font-normal border border-blue-200',
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
