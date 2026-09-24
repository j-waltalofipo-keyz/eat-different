// Navigation — SOP: architecture/notify-list.md (link clicked from an email → plain page)
import { AppError } from "@/execution/lib/errors";
import { unsubscribe } from "@/execution/notify/subscribe";

const page = (msg: string, status: number) =>
  new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>E.D.</title><p style="font-family:sans-serif;padding:16px">${msg}</p>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

export async function GET(req: Request) {
  const url = new URL(req.url);
  try {
    await unsubscribe(url.searchParams.get("e") ?? "", url.searchParams.get("s") ?? "");
    return page("You're unsubscribed from E.D. open alerts.", 200);
  } catch (e) {
    if (e instanceof AppError) return page(e.message, e.status);
    console.error(e);
    return page("Something went wrong. Please try again later.", 500);
  }
}
