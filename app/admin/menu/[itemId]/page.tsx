// Navigation — SOP: menu-admin.md. Edit a dish: the same template, filled in.
import { notFound } from "next/navigation";
import { getMenuChoices } from "@/execution/admin/menuAdmin";
import { getAdminMenu } from "@/execution/square/getMenu";
import { requireAdmin } from "../../auth";
import { DishEditor } from "../DishEditor";
import { EditorFrame } from "../EditorFrame";

export const metadata = { title: "Edit dish · E.D. Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditDish({ params }: { params: Promise<{ itemId: string }> }) {
  await requireAdmin();
  const { itemId } = await params;
  const [items, choices] = await Promise.all([getAdminMenu(), getMenuChoices()]);
  const item = items.find((i) => i.itemId === decodeURIComponent(itemId));
  if (!item) notFound();
  return (
    <EditorFrame title={`Edit ${item.name}`} hint="Change anything, then save — it updates Square and the site together.">
      <DishEditor
        item={{
          itemId: item.itemId,
          name: item.name,
          subtitle: item.subtitle,
          description: item.description,
          priceCents: item.priceCents,
          category: item.category,
          imageUrl: item.imageUrl,
          modifierListIds: item.modifierListIds,
        }}
        choices={choices}
      />
    </EditorFrame>
  );
}
