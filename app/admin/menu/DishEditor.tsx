"use client";
// SOP: menu-admin.md. The "new dish" template (and edit): drop a photo, fill the blanks, watch the real card, Save.
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { MenuChoices } from "@/execution/admin/menuAdmin";
import { MenuCard } from "@/app/_components/menu/MenuCard";
import { saveDish } from "../actions";
import { Field, inputCls, PrimaryButton, SaveStatus, submitKeepingValues } from "../ui";

export type EditorItem = {
  itemId: string;
  name: string;
  subtitle: string | null;
  description: string;
  priceCents: number;
  category: string;
  imageUrl: string | null;
  modifierListIds: string[];
};

const MAX_EDGE = 1600;

/** Browser-side shrink (menu-admin.md → Photo pipeline 1). Falls back to the original if the browser can't decode it. */
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "dish.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function DishEditor({ item, choices }: { item: EditorItem | null; choices: MenuChoices }) {
  const [state, action, pending] = useActionState(saveDish, undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(item?.name ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? (item.priceCents / 100).toFixed(2) : "");
  const [category, setCategory] = useState(item?.category ?? choices.categories[0] ?? "__new__");
  const [newCategory, setNewCategory] = useState("");
  const [photo, setPhoto] = useState<{ url: string; local: boolean } | null>(item?.imageUrl ? { url: item.imageUrl, local: false } : null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => void (photo?.local && URL.revokeObjectURL(photo.url)), [photo]);

  const takeFile = async (file: File | undefined) => {
    setDragging(false);
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      setPhotoNote("That file isn't a photo. Try a JPG or PNG.");
      return;
    }
    setPhotoNote("Getting your photo ready…");
    const ready = await shrink(file);
    const dt = new DataTransfer();
    dt.items.add(ready);
    if (fileRef.current) fileRef.current.files = dt.files; // what the form actually sends
    setPhoto({ url: URL.createObjectURL(ready), local: true });
    setPhotoNote(ready === file && file.size > 4_000_000 ? "Big photo — it may take a moment to save." : null);
  };
  const clearPhoto = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPhoto(item?.imageUrl ? { url: item.imageUrl, local: false } : null);
    setPhotoNote(null);
  };

  const cents = Math.round(Number(price.replace(/[$,\s]/g, "")) * 100);
  const preview = {
    name: name || "Dish name",
    subtitle: subtitle || null,
    description: description || "What's in it — e.g. Crispy chicken · Hot honey · Pickles",
    priceCents: Number.isFinite(cents) ? cents : 0,
    imageUrl: photo?.url ?? null,
    soldOut: false,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <aside className="order-first grid gap-2 lg:sticky lg:top-6 lg:order-last">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-cream/50">Live preview</p>
        <div className="mx-auto w-full max-w-sm">
          <MenuCard item={preview} />
        </div>
        <p className="text-center text-xs text-cream/40">This is exactly how it shows on the site.</p>
      </aside>

      <form onSubmit={submitKeepingValues(action)} className="grid gap-6">
        <input type="hidden" name="itemId" value={item?.itemId ?? ""} />

        <div
          onDragOver={(e) => (e.preventDefault(), setDragging(true))}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => (e.preventDefault(), takeFile(e.dataTransfer.files[0]))}
          className={`relative grid min-h-48 place-items-center overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-gold bg-gold/10" : "border-cream/20 bg-cream/[0.03] hover:border-gold/60"
          }`}
        >
          <input
            ref={fileRef}
            id="photo"
            type="file"
            name="photo"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => takeFile(e.target.files?.[0])}
            aria-describedby="photo-help"
          />
          <div className="pointer-events-none grid justify-items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <p className="font-display text-xl uppercase tracking-wide">{photo ? "Swap the photo" : "Drop a photo here"}</p>
            <p id="photo-help" className="text-sm text-cream/60">
              or tap to choose one (phones can snap one) · JPG or PNG, up to 10 MB
            </p>
          </div>
        </div>
        {(photoNote || photo?.local) && (
          <div className="-mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-cream/60">{photoNote ?? "New photo ready — it uploads when you save."}</span>
            {photo?.local && (
              <button type="button" onClick={clearPhoto} className="min-h-11 rounded-full px-3 text-cream/70 hover:bg-cream/10">
                Undo photo
              </button>
            )}
          </div>
        )}

        <Field label="Dish name" htmlFor="name">
          <input id="name" name="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Loco Moco" className={inputCls} />
        </Field>
        <Field label="Subtitle (optional)" htmlFor="subtitle" hint="The fun line under the name.">
          <input id="subtitle" name="subtitle" maxLength={60} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Rice + smash patty + gravy" className={inputCls} />
        </Field>
        <Field label="What's in it" htmlFor="description" hint="Tip: separate things with · or commas.">
          <textarea
            id="description"
            name="description"
            maxLength={300}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Crispy chicken · Hot honey · Pickles · House sauce"
            className={`${inputCls} resize-y`}
          />
        </Field>
        <Field label="Price" htmlFor="price">
          <div className="relative max-w-48">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-brush text-xl text-gold">$</span>
            <input id="price" name="price" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12.00" className={`${inputCls} pl-9 font-display text-xl tracking-wide`} />
          </div>
        </Field>

        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-cream/85">Category</legend>
          <div className="flex flex-wrap gap-2">
            {[...choices.categories, "__new__"].map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} className="peer sr-only" />
                <span className="inline-flex min-h-11 items-center rounded-full border border-cream/20 px-5 font-display uppercase tracking-wider text-cream/80 transition peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50">
                  {c === "__new__" ? "+ New category" : c}
                </span>
              </label>
            ))}
          </div>
          {category === "__new__" && (
            <input name="newCategory" maxLength={30} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name, e.g. Island Plates" className={`${inputCls} mt-1`} aria-label="New category name" />
          )}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-cream/85">Choices customers get</legend>
          {choices.options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-4 rounded-2xl border border-cream/10 bg-cream/[0.03] p-4 transition has-[:checked]:border-gold/60 has-[:checked]:bg-gold/[0.07]">
              <input type="checkbox" name="options" value={o.id} defaultChecked={item?.modifierListIds.includes(o.id)} className="mt-1 h-5 w-5 shrink-0 accent-[#f5b21a]" />
              <span className="min-w-0">
                <span className="block font-semibold">{o.name}</span>
                <span className="block text-sm text-cream/60">{o.summary}</span>
                {o.required && <span className="mt-1 block text-xs text-gold">Customers must pick one</span>}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-cream/10 bg-ink/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:px-5">
          <PrimaryButton pending={pending} pendingLabel="Saving to Square…">
            {item ? "Save changes" : "Add to menu"}
          </PrimaryButton>
          <Link href="/admin?tab=menu" className="min-h-12 rounded-full px-5 py-3 text-cream/70 hover:bg-cream/10">
            Cancel
          </Link>
          <SaveStatus state={state} />
        </div>
      </form>
    </div>
  );
}
