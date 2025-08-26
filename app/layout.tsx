// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import ServiceWorkerRegistrar from "./service-worker-registrar";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "YaraGlow",
  description: "System health dashboard",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-neutral-950 text-neutral-100"}>
        {/* client-only SW registrar */}
        <ServiceWorkerRegistrar />
        {children}
        <PWAInstallBanner />
      </body>
    </html>
  );
}