// Pure type shared by the owner email and the Orders tab (browser-safe: no server imports).
export type AlertLine = { qty: number; name: string; modifiers: { qty: number; name: string }[] };
