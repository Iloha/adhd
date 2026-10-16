import { google } from '@ai-sdk/google'

// Single swap point for the AI provider. To switch to Groq, OpenRouter or
// Anthropic, change the import above and the `model` line below. Everything
// that calls the model (src/app/api/breakdown/route.ts) imports from here.
//
// Verified against the Google free tier: gemini-3.5-flash with minimal thinking.
// Model IDs change quickly; if this one 404s, update it here.
export const model = google('gemini-3.5-flash')

// Provider-specific options. Gemini 3.x "thinks" by default, and thinking tokens
// count toward maxOutputTokens, so with a low cap the JSON gets cut off.
// Minimal thinking keeps the response small and fast.
export const providerOptions = {
  google: { thinkingConfig: { thinkingLevel: 'minimal' } },
} as const

export const MAX_OUTPUT_TOKENS = 600
export const TIMEOUT_MS = 10_000
