import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] px-3 py-16 sm:px-6">
        <div data-op="venta" className="relative bg-op px-6 pt-10 pb-10 text-chapa sm:px-12">
          <span className="remache top-3 left-3" />
          <span className="remache top-3 right-3" />
          <p className="cartel text-[clamp(80px,14vw,200px)]">Se mudó</p>
          <p className="mt-4 max-w-[40ch] text-[20px]">Ese cartel ya no está colgado: la propiedad se vendió, se alquiló o la dirección está mal escrita.</p>
          <Link href="/propiedades" className="cartel mt-8 inline-flex h-16 items-center gap-3 bg-chapa px-7 text-[30px] text-tinta">
            Ver lo que hay <Arrow className="size-7" />
          </Link>
        </div>
      </main>
    </>
  );
}
