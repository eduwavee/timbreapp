import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sofia-sans";
import "@fontsource/sofia-sans-extra-condensed/800.css";
import "@fontsource/sofia-sans-extra-condensed/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "La Choza · Propiedades en venta y alquiler", template: "%s · La Choza" },
  description: "Casas, departamentos y galpones en venta y alquiler en CABA y el sur del conurbano. Tocás “Me interesa” y te escribe el dueño por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#d52b1e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
