// Phase L handshake: the public production site answers 200.
import { requireEnv } from "./lib";

export async function probeVercel(): Promise<string> {
  const env = requireEnv("SITE_URL");
  const res = await fetch(env.SITE_URL, { redirect: "manual" });
  if (res.status !== 200) throw new Error(`${env.SITE_URL} returned HTTP ${res.status} (302 = Deployment Protection)`);
  const title = (await res.text()).match(/<title>(.*?)<\/title>/)?.[1] ?? "no <title>";
  return `${env.SITE_URL} · 200 · "${title}"`;
}
