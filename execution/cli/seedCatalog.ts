// npm run seed:catalog — loads architecture/menu-seed.json into Square (SQUARE_ENVIRONMENT).
import { config } from "dotenv";
config({ quiet: true });

const { loadSeed } = await import("../square/seed");
const { seedCatalog } = await import("../square/seedCatalog");
const { getMenu } = await import("../square/getMenu");
const { formatUsd } = await import("../lib/money");

const result = await seedCatalog(loadSeed());
console.log(`✅ seeded: ${result.created} created, ${result.updated} updated`);
for (const item of await getMenu({ fresh: true })) {
  const lists = item.modifierLists.map((l) => `${l.name}${l.required ? "*" : ""}(${l.options.length})`).join(", ");
  console.log(`   ${item.category.padEnd(10)} ${item.name.padEnd(22)} ${formatUsd(item.priceCents).padStart(7)}  ${lists}`);
}
