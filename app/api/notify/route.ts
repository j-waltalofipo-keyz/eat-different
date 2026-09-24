// Navigation — SOP: architecture/notify-list.md
import { jsonBody, respond } from "@/execution/lib/http";
import { subscribe } from "@/execution/notify/subscribe";
import { NotifySchema } from "@/execution/schemas";

export async function POST(req: Request) {
  return respond(async () => subscribe(NotifySchema.parse(await jsonBody(req)).email));
}
