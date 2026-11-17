import { APICallError, generateText, NoObjectGeneratedError, Output } from 'ai'
import { ATTEMPT_TIMEOUT_MS, MAX_OUTPUT_TOKENS, TIMEOUT_MS, models, providerOptions } from '@/lib/ai'
import { MAX_TASK_LENGTH, SYSTEM_PROMPT, breakdownSchema, buildPrompt } from '@/lib/breakdown'
import { getChildModeChildId } from '@/lib/childModeServer'
import { checkRateLimit } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'

// Demo (anonymous) sessions are free to create, so they get a smaller allowance.
const DEMO_RATE_LIMIT_MAX = 3

// Vercel function limit; must stay above TIMEOUT_MS.
export const maxDuration = 30

const MSG = {
  signedOut: 'Please sign in to get step suggestions.',
  parentOnly: 'Step suggestions are only available in parent mode.',
  rateLimited: 'Too many requests, try again in a minute',
  busy: 'The step helper is busy right now. Please try again in a moment.',
  failed: 'The step helper had trouble this time. Please try again.',
  timeout: 'The step helper took too long. Please try again.',
  refused: "That doesn't look like a task I can help with. Try something like “clean your room”.",
  server: 'Suggesting steps is not available right now.',
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

// Errors worth trying the next model for: the model returned unusable output,
// it timed out, or the provider had a transient server-side problem
// (e.g. 503 "high demand").
function isRetryable(error: unknown) {
  if (NoObjectGeneratedError.isInstance(error) || isTimeout(error)) return true
  return APICallError.isInstance(error) && (error.statusCode ?? 0) >= 500
}

// Server-side only: what actually went wrong, so a 504/502 is explainable from
// the logs. Never sent to the client.
function describeError(modelId: string | undefined, error: unknown) {
  return {
    model: modelId,
    status: APICallError.isInstance(error) ? error.statusCode : undefined,
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
  }
}

export async function POST(request: Request) {
  // Auth first: signed-out callers never reach the rate limiter or the model.
  // getClaims() verifies the JWT, so a forged cookie is rejected.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return json({ error: MSG.signedOut }, 401)

  // Child mode is a soft lock, but a child has no reason to call the AI.
  if (await getChildModeChildId()) return json({ error: MSG.parentOnly }, 403)

  // Limit per account, and per IP as well so new demo sessions cannot dodge the limit.
  const isDemo = data?.claims?.is_anonymous === true
  const userAllowed = checkRateLimit(`user:${userId}`, isDemo ? { max: DEMO_RATE_LIMIT_MAX } : undefined)
  const ipAllowed = checkRateLimit(`ip:${clientIp(request)}`)
  if (!userAllowed || !ipAllowed) {
    return json({ error: MSG.rateLimited }, 429)
  }

  let task: unknown
  try {
    task = (await request.json())?.task
  } catch {
    return json({ error: 'Send a JSON body like { "task": "clean your room" }.' }, 400)
  }

  if (typeof task !== 'string' || task.trim().length === 0) {
    return json({ error: 'Please type a task first.' }, 400)
  }
  const cleanTask = task.trim()
  if (cleanTask.length > MAX_TASK_LENGTH) {
    return json({ error: `Task is too long (max ${MAX_TASK_LENGTH} characters).` }, 400)
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('breakdown: GOOGLE_GENERATIVE_AI_API_KEY is not set')
    return json({ error: MSG.server }, 500)
  }

  // One deadline for all models, so the request never runs longer than TIMEOUT_MS.
  const deadline = AbortSignal.timeout(TIMEOUT_MS)
  let lastError: unknown

  for (const model of models) {
    try {
      const { output } = await generateText({
        model,
        providerOptions,
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(cleanTask),
        output: Output.object({ schema: breakdownSchema }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        abortSignal: AbortSignal.any([deadline, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)]),
      })

      if (!output.ok) return json({ error: MSG.refused }, 422)
      return json({ steps: output.steps })
    } catch (error) {
      lastError = error
      console.error('breakdown: AI attempt failed', describeError(model.modelId, error))
      if (!isRetryable(error) || deadline.aborted) break
    }
  }

  if (isTimeout(lastError)) return json({ error: MSG.timeout }, 504)
  if (APICallError.isInstance(lastError)) {
    if (lastError.statusCode === 429) return json({ error: MSG.rateLimited }, 429)
    if (lastError.statusCode === 503) return json({ error: MSG.busy }, 503)
  }
  return json({ error: MSG.failed }, 502)
}
