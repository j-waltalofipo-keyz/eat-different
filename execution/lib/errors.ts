// Expected, user-facing failures carry a stable code and an HTTP status.
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string = code,
  ) {
    super(message);
    this.name = "AppError";
  }
}
