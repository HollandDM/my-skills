import { Data, Effect } from "effect"

/** A user-facing failure: printed as `error <message>` on stderr, exit 1. */
export class Fail extends Data.TaggedError("Fail")<{ readonly message: string }> {}

/** `approve` refuses with a list of problems, printed verbatim on stderr. */
export class Refused extends Data.TaggedError("Refused")<{ readonly lines: string[] }> {}

export const fail = (message: string): Fail => new Fail({ message })

/** Any error (platform errors included) becomes a `Fail` carrying its message. */
export const toFail = (error: unknown): Fail => (error instanceof Fail ? error : new Fail({ message: messageOf(error) }))

/** Map every failure of an effect to `Fail`. */
export const asFail = <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, Fail, R> => Effect.mapError(self, toFail)

export const messageOf = (error: unknown): string => {
  if (error instanceof Fail) return error.message
  if (error instanceof Error) return error.message
  return String(error)
}
