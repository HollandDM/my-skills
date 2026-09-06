/** Local-time stamps in CPython's isoformat shapes. */
const two = (n: number): string => String(n).padStart(2, "0")

/** datetime.date.today().isoformat() */
export const today = (d: Date = new Date()): string => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`

/** datetime.datetime.now().isoformat(timespec="microseconds") — local time, six fractional digits, no zone. */
export const now = (d: Date = new Date()): string =>
  `${today(d)}T${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}000`
