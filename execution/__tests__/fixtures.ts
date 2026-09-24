// Menu fixture mirroring architecture/menu-seed.json, with fake Square ids.
import type { MenuItem, ModifierList, OrderRow } from "../schemas";

const waffle: ModifierList = {
  id: "ML_WAFFLE",
  name: "Choose your waffle",
  selection: "SINGLE",
  required: true,
  maxQtyPerOption: 1,
  options: [
    { id: "M_CLASSIC", name: "Classic", priceCents: 0 },
    { id: "M_CHOC", name: "Chocolate Chip", priceCents: 0 },
  ],
};
const combo: ModifierList = {
  id: "ML_COMBO",
  name: "Make it a combo",
  selection: "SINGLE",
  required: false,
  maxQtyPerOption: 1,
  options: [{ id: "M_COMBO", name: "The E.D. Combo (fries + drink of the day)", priceCents: 500 }],
};
const addons: ModifierList = {
  id: "ML_ADDONS",
  name: "Add-ons",
  selection: "MULTIPLE",
  required: false,
  maxQtyPerOption: 3,
  options: [
    { id: "M_SAUCE", name: "Extra Sauce", priceCents: 50 },
    { id: "M_BACON", name: "Bacon", priceCents: 150 },
    { id: "M_CHEESE", name: "Cheese", priceCents: 100 },
  ],
};

const item = (p: Partial<MenuItem> & Pick<MenuItem, "variationId" | "name" | "priceCents">): MenuItem => ({
  itemId: `I_${p.variationId}`,
  subtitle: null,
  description: "",
  imageUrl: null,
  category: "Menu",
  soldOut: false,
  modifierLists: [],
  ...p,
});

export const MENU: MenuItem[] = [
  item({ variationId: "V_SWEET", name: "The Sweet Heat", priceCents: 1200, modifierLists: [waffle, combo, addons] }),
  item({ variationId: "V_BURGER", name: "The E.D. Burger", priceCents: 1200, modifierLists: [combo, addons] }),
  item({ variationId: "V_TERIYAKI", name: "Teriyaki After Dark", priceCents: 1300, modifierLists: [addons] }),
  item({ variationId: "V_CORN", name: "Hammered Corn", priceCents: 700, modifierLists: [addons], soldOut: true }),
];

export const order = (p: Partial<OrderRow> = {}): OrderRow => ({
  square_order_id: "ORDER_1",
  kind: "FOOD",
  square_payment_id: null,
  receipt_number: null,
  buyer_email: null,
  customer_name: "Tay",
  total_cents: 2000,
  status: "PENDING",
  created_at: "2026-09-23T12:00:00Z",
  paid_at: null,
  ...p,
});
