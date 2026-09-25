// Pure. Display-only weekly hours (D42) — SOPs: admin.md (Save hours), site-pages.md (Hero, Footer).
import type { WeekHours } from "../schemas";

export const KC_TZ = "America/Chicago";
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const parts = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return { h, m, meridiem: h < 12 ? "AM" : "PM", h12: h % 12 || 12 };
};

/** "17:00" → "5 PM", "17:30" → "5:30 PM", "00:00" → "12 AM". */
export function formatTime(hhmm: string): string {
  const { m, meridiem, h12 } = parts(hhmm);
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${meridiem}`;
}

/** "5–9 PM" when both ends share AM/PM, otherwise "11 AM–2 PM". */
export function formatRange(open: string, close: string): string {
  const a = parts(open);
  const b = parts(close);
  const bare = (p: ReturnType<typeof parts>) => `${p.h12}${p.m ? `:${String(p.m).padStart(2, "0")}` : ""}`;
  return a.meridiem === b.meridiem ? `${bare(a)}–${bare(b)} ${b.meridiem}` : `${formatTime(open)}–${formatTime(close)}`;
}

/** Consecutive days with the same hours collapse: [{ days: "Fri–Sun", time: "5–9 PM" }]. Closed days are left out. */
export function groupHours(week: WeekHours): { days: string; time: string }[] {
  const out: { days: string; time: string }[] = [];
  let i = 0;
  while (i < 7) {
    const d = week[i];
    if (!d) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < 7 && week[j + 1]?.open === d.open && week[j + 1]?.close === d.close) j++;
    out.push({ days: j === i ? DAY_SHORT[i]! : `${DAY_SHORT[i]}${j - i === 1 ? " & " : "–"}${DAY_SHORT[j]}`, time: formatRange(d.open, d.close) });
    i = j + 1;
  }
  return out;
}

/** Kansas City wall-clock for an instant: weekday index (Mon = 0) and "HH:MM". */
export function kcClock(now: Date, tz = KC_TZ): { day: number; hhmm: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return { day: DAY_SHORT.indexOf(p.weekday as (typeof DAY_SHORT)[number]), hhmm: `${p.hour}:${p.minute}` };
}

/**
 * The next usual opening strictly after `now` (KC time), for the "kitchen's closed" pill:
 * "today 5 PM" · "tomorrow 5 PM" · "Fri 5 PM". Null when no hours are set.
 */
export function nextOpening(week: WeekHours, now: Date, tz = KC_TZ): string | null {
  const { day, hhmm } = kcClock(now, tz);
  for (let ahead = 0; ahead < 8; ahead++) {
    const d = week[(day + ahead) % 7];
    if (!d || (ahead === 0 && d.open <= hhmm)) continue;
    const when = ahead === 0 ? "today" : ahead === 1 ? "tomorrow" : DAY_SHORT[(day + ahead) % 7];
    return `${when} ${formatTime(d.open)}`;
  }
  return null;
}
