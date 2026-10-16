import { APICallError, generateText, NoObjectGeneratedError, Output } from 'ai'
import { MAX_OUTPUT_TOKENS, TIMEOUT_MS, model, providerOptions } from '@/lib/ai'
import { MAX_TASK_LENGTH, SYSTEM_PROMPT, breakdownSchema, buildPrompt } from '@/lib/breakdown'
import { checkRateLimit } from '@/lib/rateLimit'

const MSG = {
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

// Errors worth one more attempt: the model returned unusable output, or the
// provider had a transient server-side problem (e.g. 503 "high demand").
function isRetryable(error: unknown) {
  if (NoObjectGeneratedError.isInstance(error)) return true
  return APICallError.isInstance(error) && (error.statusCode ?? 0) >= 500
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientIp(request))) {
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

  // One deadline for all attempts, so the request never runs longer than TIMEOUT_MS.
  const abortSignal = AbortSignal.timeout(TIMEOUT_MS)
  let lastError: unknown

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { output } = await generateText({
        model,
        providerOptions,
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(cleanTask),
        output: Output.object({ schema: breakdownSchema }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        maxRetries: 0,
        abortSignal,
      })

      if (!output.ok) return json({ error: MSG.refused }, 422)
      return json({ steps: output.steps })
    } catch (error) {
      lastError = error
      if (!isRetryable(error)) break
    }
  }

  console.error('breakdown: AI request failed', lastError)

  if (isTimeout(lastError)) return json({ error: MSG.timeout }, 504)
  if (APICallError.isInstance(lastError)) {
    if (lastError.statusCode === 429) return json({ error: MSG.rateLimited }, 429)
    if (lastError.statusCode === 503) return json({ error: MSG.busy }, 503)
  }
  return json({ error: MSG.failed }, 502)
}
