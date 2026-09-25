"use client";
// SOP: admin.md → Site tab. What the public sees, one card (one Save) at a time.
import { useState, useTransition } from "react";
import type { Settings, WeekHours } from "@/execution/schemas";
import { DAY_LONG, groupHours } from "@/execution/site/hours";
import { sendOpenAlertAction } from "../actions";
import { Card, CardForm, Chip, Field, inputCls, Switch } from "../ui";

function AnnouncementCard({ s }: { s: Settings }) {
  const [on, setOn] = useState(s.announcement_on);
  const [text, setText] = useState(s.announcement_text ?? "");
  return (
    <Card title="Announcement banner" hint="A strip across the very top of the site. Great for “Sold out early — back Friday!”">
      <CardForm card="announcement">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <Switch name="announcement_on" checked={on} onChange={setOn} label="Show the banner" />
          {on ? "Showing on the site" : "Hidden"}
        </label>
        <Field label="Message" htmlFor="announcement_text" hint={`${text.length}/140`}>
          <input id="announcement_text" name="announcement_text" maxLength={140} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Sold out early tonight — back Friday!" className={inputCls} />
        </Field>
        {text && (
          <div aria-hidden className={`overflow-hidden rounded-xl transition-opacity ${on ? "" : "opacity-40"}`}>
            <p className="bg-gold px-4 py-2 text-center font-display text-sm uppercase tracking-wider text-ink">{text}</p>
          </div>
        )}
      </CardForm>
    </Card>
  );
}

function HoursCard({ s }: { s: Settings }) {
  const [week, setWeek] = useState<WeekHours>(s.hours);
  const set = (d: number, v: WeekHours[number]) => setWeek((w) => w.map((x, i) => (i === d ? v : x)));
  const summary = groupHours(week.map((d) => (d && d.close > d.open ? d : null)));
  return (
    <Card title="Hours" hint="Shown on the site so people know when to look. Orders still only start when you flip the kitchen open.">
      <CardForm card="hours">
        <ul className="grid gap-2">
          {DAY_LONG.map((day, d) => {
            const h = week[d];
            return (
              <li key={day} className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream/[0.03] px-4 py-3">
                <Switch name={`d${d}_open`} checked={!!h} onChange={(on) => set(d, on ? (week.find(Boolean) ?? { open: "17:00", close: "21:00" }) : null)} label={`Open on ${day}`} />
                <span className="w-24 font-semibold">{day}</span>
                {h ? (
                  <span className="flex flex-1 items-center gap-2">
                    <input type="time" name={`d${d}_from`} value={h.open} onChange={(e) => set(d, { ...h, open: e.target.value })} className={`${inputCls} min-h-11 w-auto py-2`} aria-label={`${day} opens`} />
                    <span className="text-cream/50">to</span>
                    <input type="time" name={`d${d}_to`} value={h.close} onChange={(e) => set(d, { ...h, close: e.target.value })} className={`${inputCls} min-h-11 w-auto py-2`} aria-label={`${day} closes`} />
                  </span>
                ) : (
                  <span className="text-sm text-cream/40">Closed</span>
                )}
              </li>
            );
          })}
        </ul>
        <Field label="Note (optional)" htmlFor="hours_note">
          <input id="hours_note" name="hours_note" maxLength={80} defaultValue={s.hours_note ?? ""} placeholder="e.g. or until sold out" className={inputCls} />
        </Field>
        <p className="text-sm text-cream/60">
          On the site: <span className="text-cream">{summary.length ? summary.map((g) => `${g.days} ${g.time}`).join(" · ") : "no hours shown"}</span>
        </p>
      </CardForm>
    </Card>
  );
}

function NotifyCard({ subscribers }: { subscribers: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const send = () =>
    start(async () => {
      const { sent, failed } = await sendOpenAlertAction();
      setMsg(failed ? `Sent to ${sent}. ${failed} didn't go through.` : `Sent to ${sent} ✓`);
    });
  return (
    <Card title="Notify list" hint="People who asked for an email when you open.">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p>
          <span className="font-brush text-4xl text-gold">{subscribers}</span> <span className="text-cream/70">{subscribers === 1 ? "person is" : "people are"} waiting</span>
        </p>
        <button type="button" disabled={pending || subscribers === 0} onClick={send} className="min-h-12 rounded-full border border-gold px-6 font-display uppercase tracking-wider text-gold hover:bg-gold/10 disabled:opacity-40">
          {pending ? "Sending…" : "Email them now"}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-[#8fe3a8]">{msg}</p>}
    </Card>
  );
}

export function SiteTab({ settings: s, subscribers }: { settings: Settings; subscribers: number }) {
  return (
    <>
      <div>
        <h1 className="font-display text-4xl uppercase leading-none">Your site</h1>
        <p className="mt-1 text-sm text-cream/60">Change what customers see. Each card saves on its own.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="grid gap-6">
          <AnnouncementCard s={s} />
          <Card title="Drink of the day" hint="Shows on the menu and inside “Make it a combo”.">
            <CardForm card="drink">
              <Field label="Today's drink" htmlFor="drink_of_the_day" hint="Leave empty to just say “drink of the day”.">
                <input id="drink_of_the_day" name="drink_of_the_day" maxLength={60} defaultValue={s.drink_of_the_day ?? ""} placeholder="e.g. Pineapple lemonade" className={inputCls} />
              </Field>
            </CardForm>
          </Card>
          <Card title="Pickup" hint="Where customers grab their food.">
            <CardForm card="pickup">
              <Field label="Pickup area" htmlFor="pickup_area" hint={<Chip tone="gold">Everyone sees this</Chip>}>
                <input id="pickup_area" name="pickup_area" maxLength={60} defaultValue={s.pickup_area ?? ""} placeholder="e.g. Waldo, KC" className={inputCls} />
              </Field>
              <Field label="Exact pickup address" htmlFor="pickup_address" hint={<Chip tone="ok">🔒 Only shown after someone pays</Chip>}>
                <input id="pickup_address" name="pickup_address" maxLength={500} defaultValue={s.pickup_address ?? ""} placeholder="Street address" className={inputCls} autoComplete="off" />
              </Field>
              <Field label="Pickup instructions" htmlFor="pickup_instructions" hint={<Chip tone="ok">🔒 Only shown after someone pays</Chip>}>
                <textarea id="pickup_instructions" name="pickup_instructions" maxLength={500} rows={3} defaultValue={s.pickup_instructions ?? ""} placeholder="e.g. Text when you pull up — I'll bring it out" className={`${inputCls} resize-y`} />
              </Field>
            </CardForm>
          </Card>
        </div>
        <div className="grid gap-6">
          <HoursCard s={s} />
          <Card title="Links" hint="Each one appears on the site only once it's filled in.">
            <CardForm card="links">
              <Field label="Instagram" htmlFor="instagram_url">
                <input id="instagram_url" name="instagram_url" type="url" defaultValue={s.instagram_url ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
              </Field>
              <Field label="TikTok" htmlFor="tiktok_url">
                <input id="tiktok_url" name="tiktok_url" type="url" defaultValue={s.tiktok_url ?? ""} placeholder="https://tiktok.com/@…" className={inputCls} />
              </Field>
              <Field label="Facebook" htmlFor="facebook_url">
                <input id="facebook_url" name="facebook_url" type="url" defaultValue={s.facebook_url ?? ""} placeholder="https://facebook.com/…" className={inputCls} />
              </Field>
              <Field label="Google review link" htmlFor="google_review_url" hint="Shown to everyone who leaves a review here.">
                <input id="google_review_url" name="google_review_url" type="url" defaultValue={s.google_review_url ?? ""} placeholder="https://g.page/r/…" className={inputCls} />
              </Field>
            </CardForm>
          </Card>
          <NotifyCard subscribers={subscribers} />
        </div>
      </div>
    </>
  );
}
