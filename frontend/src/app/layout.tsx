import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Timbre", template: "%s · Timbre" },
  description: "Gestión de alquileres: cobranzas, inquilinos y reclamos.",
};

export const viewport: Viewport = {
  themeColor: "#1f2b45",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
