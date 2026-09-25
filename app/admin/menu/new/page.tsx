// Navigation — SOP: menu-admin.md. "Add a dish": the template.
import { getMenuChoices } from "@/execution/admin/menuAdmin";
import { requireAdmin } from "../../auth";
import { DishEditor } from "../DishEditor";
import { EditorFrame } from "../EditorFrame";

export const metadata = { title: "Add a dish · E.D. Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewDish() {
  await requireAdmin();
  const choices = await getMenuChoices();
  return (
    <EditorFrame title="Add a dish" hint="Fill in the blanks — the card on the right is exactly what customers will see.">
      <DishEditor item={null} choices={choices} />
    </EditorFrame>
  );
}
