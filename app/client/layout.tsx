import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getMyAccess } from "@/lib/actions/client-users";
import { signOut } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const access = await getMyAccess();
  if (!access || access.userType !== "client") redirect("/login");

  return (
    <div className="min-h-screen bg-bg-surface">
      <header className="bg-white border-b border-bg-line">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/client" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-bg-green text-bg-gold flex items-center justify-center text-xs font-black">BG</div>
            <span className="text-sm font-black text-bg-green">{access.clientName ?? "بوابة العميل"}</span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-bg-text-3 hover:text-bg-danger inline-flex items-center gap-1">
              <LogOut className="size-3.5" /> خروج
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-5">{children}</main>
    </div>
  );
}
