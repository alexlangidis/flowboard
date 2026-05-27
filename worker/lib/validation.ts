import type { z } from 'zod'

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = await request.json()

  return schema.parse(body)
}
