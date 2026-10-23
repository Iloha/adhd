import LoginForm from './LoginForm'

const ERRORS: Record<string, string> = {
  link: 'That sign-in link did not work or has expired. Please request a new one.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return <LoginForm initialError={error ? (ERRORS[error] ?? null) : null} />
}
