import { createHash } from "node:crypto"
import { pyJsonDumps, type DumpsOptions } from "./pyjson.js"

export const sha256Hex = (data: string | Uint8Array): string => createHash("sha256").update(data).digest("hex")
export const sha1Hex = (data: string | Uint8Array): string => createHash("sha1").update(data).digest("hex")
/** hashlib.sha256(json.dumps(value, ...).encode()).hexdigest() */
export const sha256Json = (value: unknown, options: DumpsOptions): string => sha256Hex(Buffer.from(pyJsonDumps(value, options), "utf8"))
export const sha1Json = (value: unknown, options: DumpsOptions): string => sha1Hex(Buffer.from(pyJsonDumps(value, options), "utf8"))
