import { redirect } from "next/navigation";

// #43/#47: the standalone «Листинги» queue duplicated the Moderation center's
// «Объявления» tab. The queue now lives at /admin/moderation; this route is kept
// only so existing links (dashboard card, audit entries, bookmarks) resolve.
export default function AdminListingsPage() {
  redirect("/admin/moderation");
}
