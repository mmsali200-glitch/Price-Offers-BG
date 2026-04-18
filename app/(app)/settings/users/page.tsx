import { getCurrentRole, listUsers } from "@/lib/actions/users";
import { redirect } from "next/navigation";
import { UsersTable } from "./users-table";
import { InviteUserForm } from "./invite-form";
import { Shield, Users as UsersIcon } from "lucide-react";

export const metadata = { title: "المستخدمون والصلاحيات · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const role = await getCurrentRole();
  if (role !== "admin") {
    // Non-admins get booted to the settings home with a polite notice
    redirect("/settings?forbidden=users");
  }

  const users = await listUsers();

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
          <UsersIcon className="size-6" />
          المستخدمون والصلاحيات
        </h1>
        <p className="text-sm text-bg-text-3 mt-1">
          {users.length} عضو في الفريق. غيّر الدور أو أدخل بيانات العضو.
        </p>
      </header>

      <div className="card p-4 bg-bg-info-lt border-r-[3px] border-bg-info">
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-bg-info mt-0.5" />
          <div className="text-xs text-[#1d4ed8] leading-relaxed">
            <div className="font-black mb-1">نظام الأدوار</div>
            <ul className="space-y-0.5 list-disc pr-4">
              <li><b>مسؤول (Admin):</b> كل الصلاحيات + إدارة المستخدمين.</li>
              <li><b>مدير (Manager):</b> يرى كل العروض في الفريق + يحرّر عروضه.</li>
              <li><b>مندوب مبيعات (Sales):</b> يرى وينشئ عروضه فقط.</li>
            </ul>
            <p className="mt-2 text-[11px] text-bg-text-3">
              لدعوة عضو جديد: أرسل له رابط التطبيق، يسجّل حساب بنفسه من صفحة الدخول،
              ثم ارجع هنا لتغيير دوره من &quot;مندوب مبيعات&quot; إلى ما تحتاج.
            </p>
          </div>
        </div>
      </div>

      <InviteUserForm />

      <UsersTable users={users} />
    </div>
  );
}
