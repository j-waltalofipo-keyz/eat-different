// Phase L handshake: Square responds, the token works, and SQUARE_LOCATION_ID is one of ours.
import { SquareClient, SquareEnvironment } from "square";
import { requireEnv } from "./lib";

export async function probeSquare(): Promise<string> {
  const env = requireEnv("SQUARE_ENVIRONMENT", "SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID");
  if (env.SQUARE_ENVIRONMENT !== "sandbox" && env.SQUARE_ENVIRONMENT !== "production") {
    throw new Error(`SQUARE_ENVIRONMENT must be "sandbox" or "production", got "${env.SQUARE_ENVIRONMENT}"`);
  }
  const client = new SquareClient({
    token: env.SQUARE_ACCESS_TOKEN,
    environment: env.SQUARE_ENVIRONMENT === "sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
  });

  const { locations = [] } = await client.locations.list();
  const location = locations.find((l) => l.id === env.SQUARE_LOCATION_ID);
  if (!location) {
    const ids = locations.map((l) => `${l.id} (${l.name})`).join(", ") || "none";
    throw new Error(`SQUARE_LOCATION_ID not found. Locations on this account: ${ids}`);
  }

  let items = 0;
  for await (const _ of await client.catalog.list({ types: "ITEM" })) items++;

  return `${env.SQUARE_ENVIRONMENT} · location "${location.name}" (${location.status}) · ${items} catalog items`;
}
