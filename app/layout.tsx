import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Business Gate — مُعِد عروض الأسعار",
  description:
    "منصة Business Gate لإنشاء عروض أسعار Odoo ERP وإرسالها للعملاء والتوقيع الإلكتروني.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={notoArabic.variable}>
      <body className="min-h-screen bg-bg-surface">{children}</body>
    </html>
  );
}
