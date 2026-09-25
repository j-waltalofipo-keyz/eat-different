// SOP: architecture/menu-admin.md → Photo pipeline. Any readable image → clean JPEG for Square (JPEG/PNG/GIF only).
import { AppError } from "../lib/errors";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MIN_EDGE_PX = 300;
export const MAX_EDGE_PX = 1600;

/** IO (sharp). Rotates from EXIF, fits inside 1600×1600, JPEG q84, strips metadata. */
export async function processPhoto(file: Blob): Promise<Buffer> {
  if (file.size === 0) throw new AppError("PHOTO_EMPTY", 400, "That photo is empty. Try choosing it again.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("PHOTO_TOO_BIG", 413, "That photo is over 10 MB. Try a smaller one.");
  const { default: sharp } = await import("sharp");
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" }).rotate();
    const { width = 0, height = 0 } = await input.metadata();
    if (Math.min(width, height) < MIN_EDGE_PX) {
      throw new AppError("PHOTO_TOO_SMALL", 400, `That photo is too small (${width}×${height}). Use one at least ${MIN_EDGE_PX}px on each side.`);
    }
    return await input
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("PHOTO_UNREADABLE", 400, "Couldn't read that photo — try a JPG or PNG.");
  }
}
