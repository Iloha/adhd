import bcrypt from 'bcryptjs'

export const PIN_LENGTH = 4
const PIN_PATTERN = /^\d{4}$/
const BCRYPT_ROUNDS = 10

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && PIN_PATTERN.test(pin)
}

/** bcrypt hash (bcryptjs is pure JS, so it needs no native build on Vercel). Server only. */
export async function hashPin(pin: string): Promise<string> {
  if (!isValidPin(pin)) throw new Error('PIN must be exactly 4 digits')
  return bcrypt.hash(pin, BCRYPT_ROUNDS)
}

export async function verifyPin(pin: unknown, hash: string): Promise<boolean> {
  if (!isValidPin(pin) || !hash) return false
  try {
    return await bcrypt.compare(pin, hash)
  } catch {
    return false
  }
}
