import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full flex-1 max-w-[1440px] px-4 pt-20 pb-28 sm:px-8 sm:pt-32 sm:pb-40">
        <h1 className="titulo max-w-[14ch] text-[clamp(44px,7vw,112px)]">Esta página no existe.</h1>
        <p className="mt-6 max-w-[46ch] text-[18px] text-tinta-2">La propiedad se vendió, se alquiló o el link está mal escrito.</p>
        <Link href="/propiedades" className="dato mt-10 inline-flex h-12 items-center gap-3 bg-tinta px-6 text-[14px] text-hueso hover:bg-tinta-2">
          Ver lo que hay <Arrow className="size-4" />
        </Link>
      </main>
      <SiteFooter meta={null} />
    </>
  );
}
