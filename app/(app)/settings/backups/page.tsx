import { listBackups } from "@/lib/actions/backups";
import { BackupManager } from "./backup-manager";

export const metadata = { title: "النسخ الاحتياطية · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const backups = await listBackups();
  return <BackupManager initialBackups={backups} />;
}
