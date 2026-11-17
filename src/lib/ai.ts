import { google } from '@ai-sdk/google'

// Single swap point for the AI provider. To switch to Groq, OpenRouter or
// Anthropic, change the import above and the `model` line below. Everything
// that calls the model (src/app/api/breakdown/route.ts) imports from here.
//
// Models are tried in order: if the first fails (503 "high demand", timeout,
// unusable output), the route falls back to the next one.
// Probed against the Google free tier on 2026-11-17: the full flash models were
// returning 503s and hanging, while these two flash-lite models answered with
// valid JSON in about 2-7s. Model IDs change quickly; if one 404s, update it here.
export const models = [google('gemini-3.5-flash-lite'), google('gemini-3.1-flash-lite')]

// Provider-specific options. Gemini 3.x "thinks" by default, and thinking tokens
// count toward maxOutputTokens, so with a low cap the JSON gets cut off.
// Minimal thinking keeps the response small and fast.
export const providerOptions = {
  google: { thinkingConfig: { thinkingLevel: 'minimal' } },
} as const

export const MAX_OUTPUT_TOKENS = 600
// TIMEOUT_MS is the deadline for the whole request, shared by all models.
// ATTEMPT_TIMEOUT_MS caps a single model so a hanging first model cannot use
// the whole deadline and leave nothing for the fallback.
export const TIMEOUT_MS = 20_000
export const ATTEMPT_TIMEOUT_MS = 12_000
