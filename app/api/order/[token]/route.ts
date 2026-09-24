// Navigation — SOP: architecture/square-webhook.md → getOrderView (pickup address guard)
import { AppError } from "@/execution/lib/errors";
import { respond } from "@/execution/lib/http";
import { getOrderView } from "@/execution/orders/getOrderView";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  return respond(async () => {
    const view = await getOrderView((await params).token);
    if (!view) throw new AppError("NOT_FOUND", 404, "Order not found.");
    return view;
  });
}
