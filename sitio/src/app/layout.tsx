import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/chivo-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "La Choza · Propiedades en venta y alquiler", template: "%s · La Choza" },
  description: "Casas, departamentos y galpones en venta y alquiler en CABA y el sur del conurbano. Tocás “Me interesa” y te escribimos por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#f1f0ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
