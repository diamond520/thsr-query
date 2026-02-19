// src/lib/taiwan-date.ts
// Taiwan timezone utility — safe in both server and client environments.
// Taiwan (Asia/Taipei) is always UTC+8, never observes DST.

/**
 * Returns today's date as a Date object using Asia/Taipei timezone.
 * Use inside useState() initializer to avoid server/client hydration mismatch:
 *   const [date, setDate] = useState<Date>(() => getTaiwanToday())
 *
 * DO NOT call outside useState/useEffect on client — server renders UTC,
 * client initializer runs in browser timezone-aware context.
 */
export function getTaiwanToday(): Date {
  // en-CA locale produces "YYYY-MM-DD" format directly
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  // Append T00:00:00 to parse as midnight local time (not UTC midnight)
  return new Date(dateStr + 'T00:00:00')
}
