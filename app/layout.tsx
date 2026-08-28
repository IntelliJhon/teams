import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Order Portal",
  description: "Multi-product garment order configuration",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevent auto-zoom on inputs in Safari/WhatsApp
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{ className: "font-medium text-sm" }}
        />
      </body>
    </html>
  );
}
