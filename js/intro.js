/* Museologías Expandidas — transición portada → sección crema (Home)
   - Parallax: la portada se desplaza más lento que el scroll y se funde un poco con el azul.
   - El título entra palabra por palabra.
   - La invitación a hacer scroll se desvanece al empezar a bajar. */
(function () {
  const intro = document.querySelector(".intro");
  const hero = document.querySelector(".hero--home");
  if (!intro) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Título palabra por palabra ---------- */
  const titulo = intro.querySelector(".intro__title");
  if (titulo) {
    const palabras = titulo.textContent.trim().split(/\s+/);
    titulo.setAttribute("aria-label", titulo.textContent.trim());
    titulo.innerHTML = palabras
      .map((p, i) => `<span class="palabra" aria-hidden="true"><span style="--i:${i}">${p}</span></span>`)
      .join(" ");
  }

  /* ---------- Parallax de la portada + invitación a hacer scroll ---------- */
  const cue = document.querySelector(".scroll-cue");
  let pendiente = false;
  const actualizar = () => {
    pendiente = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const s = hero && hero.querySelector(".hero__svg");
    if (s && !reduce && y < vh * 1.2) {
      s.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
      hero.style.setProperty("--velo", clamp(y / vh).toFixed(3));
    }
    if (cue) cue.classList.toggle("is-oculto", y > 60);
    escena(vh);
  };

  /* ---------- Transición sección 2 → 3 tipo cortina ----------
     La sección crema queda fija cuando su borde inferior llega al fondo de la pantalla
     (top sticky = alto de pantalla − alto de la sección). La sección 3 sube por encima;
     mientras la tapa, la crema se oscurece un poco. Cuando la 3 cubre la pantalla
     aparecen el título y luego la ruleta (si se vuelve a subir, desaparecen). */
  const explorar = document.querySelector(".explorar-home");
  const fijarIntro = () => {
    const top = Math.min(0, window.innerHeight - intro.offsetHeight);
    intro.style.setProperty("--intro-top", top + "px");
  };
  fijarIntro();
  new ResizeObserver(fijarIntro).observe(intro);
  window.addEventListener("resize", fijarIntro);

  function escena(vh) {
    if (!explorar) return;
    const r = explorar.getBoundingClientRect();
    const tapado = clamp((vh - r.top) / vh); // 0 cuando la 3 asoma abajo, 1 cuando cubre la pantalla
    // la sección crema se oscurece levemente mientras queda tapada (da profundidad)
    intro.style.setProperty("--tapado", tapado.toFixed(3));
    explorar.classList.toggle("is-titulo", tapado > 0.82);
    explorar.classList.toggle("is-ruleta", tapado > 0.92);
  }
  window.addEventListener("scroll", () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
  }, { passive: true });
  actualizar();
})();
