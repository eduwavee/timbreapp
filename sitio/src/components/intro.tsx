/**
 * La entrada al inicio: sobre el fondo hueso se dibuja el techo de la marca,
 * aparece la marca y la pantalla sube como un telón. Sale una vez por sesión;
 * el script marca la visita antes de pintar, así las siguientes cargas entran directo.
 */
export function Intro() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("brunito-intro")){document.documentElement.dataset.intro="visto"}else{sessionStorage.setItem("brunito-intro","1")}}catch(e){document.documentElement.dataset.intro="visto"}`,
        }}
      />
      <div className="intro" aria-hidden>
        <span className="titulo relative inline-flex items-baseline text-[clamp(52px,8vw,96px)] tracking-[-0.045em]">
          <span className="relative">
            <svg viewBox="0 0 20 7" className="intro-techo absolute -top-[0.36em] left-[0.02em] h-[0.3em] w-[0.98em]">
              <path d="M1 6.2 10 1l9 5.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" pathLength={1} />
            </svg>
            <span className="intro-texto">br</span>
          </span>
          <span className="intro-texto">unito</span>
        </span>
      </div>
    </>
  );
}
