// Shared response handling for Navigation-layer route handlers.
import { ZodError } from "zod";
import { AppError } from "./errors";

export async function respond<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    return Response.json(await fn());
  } catch (e) {
    if (e instanceof AppError) return Response.json({ error: e.code, message: e.message }, { status: e.status });
    if (e instanceof ZodError) {
      return Response.json({ error: "INVALID_INPUT", fields: e.issues.map((i) => i.path.join(".")) }, { status: 400 });
    }
    console.error(e);
    return Response.json({ error: "INTERNAL" }, { status: 500 });
  }
}

/** Parses a JSON body; malformed JSON becomes a 400 like any other invalid input. */
export async function jsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("INVALID_INPUT", 400, "body must be JSON");
  }
}
