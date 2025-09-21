import 'server-only'

type Meta = Record<string, unknown> | undefined

export const logger = {
  warn(message: string, meta?: Meta) {
    if (meta) console.warn(message, meta)
    else console.warn(message)
  },
  error(message: unknown, meta?: Meta) {
    if (meta) console.error(message, meta)
    else console.error(message)
  },
}
