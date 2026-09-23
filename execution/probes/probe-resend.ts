// Phase L handshake: the Resend key is accepted. With send=true, delivers ONE test email to OWNER_EMAIL.
import { Resend } from "resend";
import { requireEnv } from "./lib";

export async function probeResend(send: boolean): Promise<string> {
  const env = requireEnv("RESEND_API_KEY", "OWNER_EMAIL");
  const resend = new Resend(env.RESEND_API_KEY);

  if (!send) {
    const { error } = await resend.domains.list();
    // A sending-only key can't list domains, but that error still proves the key is real.
    if (error && error.name !== "restricted_api_key") throw new Error(`${error.name}: ${error.message}`);
    return `key accepted${error ? " (sending-only key)" : ""} · run probe:resend:send to deliver a test email`;
  }

  const { data, error } = await resend.emails.send({
    from: "Eat. Different. <onboarding@resend.dev>",
    to: env.OWNER_EMAIL,
    subject: "E.D. link test ✅",
    text: "Phase L handshake: Resend can deliver order alerts to this inbox.",
  });
  if (error) throw new Error(`${error.name}: ${error.message}`);
  return `test email sent to OWNER_EMAIL · id ${data?.id}`;
}
