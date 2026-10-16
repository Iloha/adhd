import { z } from 'zod'

export const MAX_TASK_LENGTH = 100

export const stepSchema = z.object({
  title: z.string().min(1).max(60).describe('Short action, max ~8 words'),
  hint: z.string().min(1).max(120).describe('One short, encouraging sentence'),
  minutes: z.number().int().min(1).max(5).describe('Whole minutes, 1 to 5'),
  emoji: z.string().min(1).max(8).describe('Exactly one emoji'),
})

// The model either returns steps or, for unsafe / non-task input, a refusal.
export const breakdownSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    steps: z.array(stepSchema).min(4).max(6),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.string().max(200).describe('Short, friendly explanation'),
  }),
])

export type BreakdownStep = z.infer<typeof stepSchema>
export type BreakdownResult = z.infer<typeof breakdownSchema>
