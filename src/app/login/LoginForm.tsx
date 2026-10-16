"use client"

import { useState, type FormEvent } from "react"
import Button from "../../components/Button"
import ErrorBanner from "../../components/ErrorBanner"
import { createClient } from "../../lib/supabase/client"

type Status = 'idle' | 'sending' | 'sent'

function LoginForm({ initialError = null }: { initialError?: string | null }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(initialError)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)

    const { error: err } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (err) {
      console.error('Sign-in error:', err)
      setError(err.status === 429
        ? 'Too many emails requested. Please wait a minute and try again.'
        : "We couldn't send the link. Check the email address and try again.")
      setStatus('idle')
      return
    }
    setStatus('sent')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 text-left">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Helper</h1>
          <p className="mt-2 text-gray-600">Sign in with a magic link. No password needed.</p>
        </div>

        {status === 'sent' ? (
          <div role="status" className="rounded-xl bg-green-50 border border-green-200 text-green-900 p-4">
            <p className="font-bold">Check your email</p>
            <p className="mt-1">We sent a sign-in link to <strong>{email.trim()}</strong>. Open it in this same browser.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-lg font-bold text-gray-900">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-12 text-base py-3 px-4 rounded-2xl bg-gray-100 border border-gray-400 text-gray-900 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <Button type="submit" disabled={status === 'sending' || email.trim() === ''}>
              {status === 'sending' ? 'Sending...' : 'Email me a link'}
            </Button>
          </form>
        )}

        <ErrorBanner message={error} />
      </div>
    </main>
  )
}

export default LoginForm
