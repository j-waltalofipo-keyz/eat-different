// SOP: architecture/checkout.md step 4. Pure — prices come only from the menu.
import { AppError } from "../lib/errors";
import type { CheckoutRequest, MenuItem } from "../schemas";

export type PricedModifier = { id: string; name: string; qty: number; priceCents: number };
export type PricedLine = {
  variationId: string;
  name: string;
  qty: number;
  basePriceCents: number;
  modifiers: PricedModifier[];
  lineTotalCents: number;
};
export type PricedCart = { lines: PricedLine[]; totalCents: number };

const cartError = (code: string, message: string) => new AppError(code, 422, message);

export function priceCart(req: Pick<CheckoutRequest, "items">, menu: MenuItem[]): PricedCart {
  const byVariation = new Map(menu.map((item) => [item.variationId, item]));

  const lines = req.items.map((line): PricedLine => {
    const item = byVariation.get(line.variationId);
    if (!item) throw cartError("UNKNOWN_ITEM", "That item isn't on the menu anymore.");
    if (item.soldOut) throw cartError("SOLD_OUT", `${item.name} is sold out.`);

    const seen = new Set<string>();
    const chosen = line.modifiers.map((m) => {
      if (seen.has(m.id)) throw cartError("DUPLICATE_MODIFIER", `${item.name}: an option was listed twice.`);
      seen.add(m.id);
      const list = item.modifierLists.find((l) => l.options.some((o) => o.id === m.id));
      if (!list) throw cartError("UNKNOWN_MODIFIER", `${item.name}: that option isn't available.`);
      if (m.qty < 1 || m.qty > list.maxQtyPerOption) {
        throw cartError("MODIFIER_QTY", `${item.name}: ${list.name} allows 1–${list.maxQtyPerOption} of each.`);
      }
      const option = list.options.find((o) => o.id === m.id)!;
      return { listId: list.id, modifier: { id: option.id, name: option.name, qty: m.qty, priceCents: option.priceCents } };
    });

    for (const list of item.modifierLists) {
      const count = chosen.filter((c) => c.listId === list.id).length;
      if (list.required && count === 0) throw cartError("MISSING_REQUIRED", `${item.name}: ${list.name} is required.`);
      if (list.selection === "SINGLE" && count > 1) throw cartError("TOO_MANY_CHOICES", `${item.name}: pick one ${list.name}.`);
    }

    const modifiers = chosen.map((c) => c.modifier);
    const unitCents = item.priceCents + modifiers.reduce((sum, m) => sum + m.priceCents * m.qty, 0);
    return {
      variationId: item.variationId,
      name: item.name,
      qty: line.qty,
      basePriceCents: item.priceCents,
      modifiers,
      lineTotalCents: unitCents * line.qty,
    };
  });

  return { lines, totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0) };
}
