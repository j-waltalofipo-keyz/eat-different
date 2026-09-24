// SOP: architecture/notify-list.md → we're-open alert. Owner-triggered only.
import { db, mailer } from "../lib/clients";
import { getEnv } from "../lib/env";
import { escapeHtml } from "../lib/html";
import { unsubscribeUrl } from "../notify/subscribe";
import { FROM, type Email } from "./sendOwnerAlert";

/** Pure. */
export function buildOpenAlertEmail(menuUrl: string, unsubUrl: string): Email {
  const text = `The E.D. kitchen is open. Order now: ${menuUrl}\n\nDon't want these? Unsubscribe: ${unsubUrl}`;
  return {
    subject: "♛ E.D. is open — come eat different",
    text,
    html:
      `<p>The E.D. kitchen is open.</p><p><a href="${escapeHtml(menuUrl)}">See the menu and order</a></p>` +
      `<p style="font-size:12px">Don't want these? <a href="${escapeHtml(unsubUrl)}">Unsubscribe</a></p>`,
  };
}

/** IO. Resend batch API takes up to 100 emails per call. */
export async function sendOpenAlert(): Promise<{ sent: number; failed: number }> {
  const env = getEnv();
  const { data, error } = await db().from("notify_signups").select("email").is("unsubscribed_at", null);
  if (error) throw new Error(`notify_signups select: ${error.message}`);

  const emails = data.map((r) => ({
    from: FROM,
    to: r.email as string,
    ...buildOpenAlertEmail(`${env.SITE_URL}/menu`, unsubscribeUrl(r.email, env.SITE_URL, env.APP_SECRET)),
  }));
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const res = await mailer().batch.send(chunk);
    if (res.error) {
      console.error("open alert batch failed:", res.error.name, res.error.message);
      failed += chunk.length;
    } else {
      sent += chunk.length;
    }
  }
  return { sent, failed };
}
