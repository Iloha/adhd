import { beforeEach, describe, expect, it, vi } from 'vitest'

const exchange = vi.fn()
vi.mock('../lib/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }),
}))
const clear = vi.fn()
vi.mock('../lib/childModeServer', () => ({ clearChildModeCookie: () => clear() }))

import { GET } from '../app/auth/callback/route'

const call = (query: string) => GET(new Request(`http://localhost:3000/auth/callback${query}`))

beforeEach(() => {
  exchange.mockReset()
  clear.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /auth/callback', () => {
  it('exchanges the code, clears child mode and redirects to /parent', async () => {
    exchange.mockResolvedValue({ error: null })
    const res = await call('?code=abc')
    expect(exchange).toHaveBeenCalledWith('abc')
    expect(clear).toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('http://localhost:3000/parent')
  })

  it('ignores an external next= target', async () => {
    exchange.mockResolvedValue({ error: null })
    const res = await call('?code=abc&next=//evil.example')
    expect(res.headers.get('location')).toBe('http://localhost:3000/parent')
  })

  it('goes back to /login?error=link when the code is bad', async () => {
    exchange.mockResolvedValue({ error: { message: 'expired' } })
    const res = await call('?code=bad')
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=link')
    expect(clear).not.toHaveBeenCalled()
  })

  it('goes back to /login?error=link when there is no code', async () => {
    const res = await call('')
    expect(exchange).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=link')
  })
})
