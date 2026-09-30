import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/mock-data/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.storeName}: Everyday wellness products, easier to discover`,
    template: `%s · ${siteConfig.storeName}`,
  },
  description:
    "Explore coffee, beverages, food supplements, and personal-care products from an independent reseller. Ask our AI assistant anytime and send an order inquiry.",
  applicationName: siteConfig.storeName,
};

export const viewport: Viewport = {
  themeColor: "#fcfbf8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ classNames: { toast: "rounded-xl font-sans" } }}
        />
      </body>
    </html>
  );
}
