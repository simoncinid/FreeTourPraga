import { redirect } from "next/navigation";
import { session } from "@/lib/platform/security";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import "./typography.css";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await session();
  if (!user || !["admin", "operator"].includes(user.role)) redirect("/accesso");
  return (
    <>
      <AdminWorkspace />
      {children}
    </>
  );
}
