// SOP: architecture/crop-menu.md — interim dish photos cut from the owner's menu graphic.
import type { OverlayOptions } from "sharp";
import { z } from "zod";
import cropsJson from "@/architecture/menu-crops.json";

const Box = z.object({
  left: z.number().int().min(0),
  top: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Box = z.infer<typeof Box>;

export const CropSpecSchema = z
  .object({
    source: z.string(),
    sourceWidth: z.number().int().positive(),
    sourceHeight: z.number().int().positive(),
    scale: z.number().int().min(1).max(4),
    crops: z.array(
      z.object({
        key: z.string(),
        file: z.string().regex(/^[a-z0-9-]+\.webp$/),
        rect: Box,
        cutouts: z.array(Box),
      }),
    ),
  })
  .superRefine((spec, ctx) => {
    const inside = (b: Box, w: number, h: number) => b.left + b.width <= w && b.top + b.height <= h;
    for (const c of spec.crops) {
      if (!inside(c.rect, spec.sourceWidth, spec.sourceHeight)) ctx.addIssue({ code: "custom", message: `${c.key}: rect falls outside the source` });
      for (const cut of c.cutouts) {
        if (!inside(cut, c.rect.width, c.rect.height)) ctx.addIssue({ code: "custom", message: `${c.key}: cutout falls outside its rect` });
      }
    }
  });
export type CropSpec = z.infer<typeof CropSpecSchema>;

export const loadCropSpec = (): CropSpec => CropSpecSchema.parse(cropsJson);

/** Elliptical fade to transparent, applied with `dest-in` (keeps the dish, melts the edges). */
function vignetteSvg(w: number, h: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><radialGradient id="v" cx="50%" cy="50%" r="50%">
        <stop offset="48%" stop-color="#fff" stop-opacity="1"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`,
  );
}

/** Feathered boxes over menu lettering, applied with `dest-out` (punches them transparent). */
function cutoutSvg(w: number, h: number, scale: number, cutouts: Box[]): Buffer {
  const rects = cutouts
    .map((b) => `<rect x="${b.left * scale}" y="${b.top * scale}" width="${b.width * scale}" height="${b.height * scale}"/>`)
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${2 * scale}"/></filter></defs>
      <g fill="#000" filter="url(#f)">${rects}</g>
    </svg>`,
  );
}

/** Cuts every dish in the spec into `outDir`. Returns the files written. */
export async function cropMenu(spec: CropSpec, outDir: string): Promise<string[]> {
  const { default: sharp } = await import("sharp");
  const meta = await sharp(spec.source).metadata();
  if (meta.width !== spec.sourceWidth || meta.height !== spec.sourceHeight) {
    throw new Error(
      `${spec.source} is ${meta.width}×${meta.height}, but the crops were measured on ${spec.sourceWidth}×${spec.sourceHeight}. Re-measure architecture/menu-crops.json.`,
    );
  }
  const written: string[] = [];
  for (const c of spec.crops) {
    const w = c.rect.width * spec.scale;
    const h = c.rect.height * spec.scale;
    const layers: OverlayOptions[] = [{ input: vignetteSvg(w, h), blend: "dest-in" }];
    if (c.cutouts.length) layers.push({ input: cutoutSvg(w, h, spec.scale, c.cutouts), blend: "dest-out" });
    const out = `${outDir}/${c.file}`;
    await sharp(spec.source)
      .extract(c.rect)
      .resize({ width: w, height: h, kernel: "lanczos3" })
      .sharpen({ sigma: 0.6 })
      .ensureAlpha()
      .composite(layers)
      .webp({ quality: 84, alphaQuality: 90 })
      .toFile(out);
    written.push(out);
  }
  return written;
}
