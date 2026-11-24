/* Museologías Expandidas — portada animada de la Home
   ---------------------------------------------------------------
   Secuencia:
   1. Entrada: sobre azul, las curvas de nivel se dibujan del núcleo hacia afuera.
   2. Revelación: la foto aparece DENTRO de las curvas, anillo por anillo,
      como un nivel de agua que sube en un mapa topográfico.
   3. Estado final: la foto queda dentro de una isla que respira; afuera,
      sobre el azul, siguen vivas las curvas exteriores. El mouse mueve la
      escena con un parallax suave.
   La primera vez la secuencia se ve completa: el scroll queda bloqueado hasta que termina.
   La secuencia completa se ve una vez por visita (sessionStorage). */
(function () {
  const host = document.querySelector("[data-hero-escena]");
  if (!host) return;

  const NS = "http://www.w3.org/2000/svg";
  const BOX_W = 620, BOX_H = 420;    // espacio de diseño del isotipo
  const T_MIN = -0.8, T_STEP = 0.1;  // anillos: t<0 = curvas exteriores sobre el azul, t=1 = núcleo
  const IMG = host.dataset.img;
  // data-final="isla"     → la foto queda dentro de una isla que respira (curvas vivas afuera)
  // data-final="completa" → la ventana se abre hasta cubrir la portada y queda la foto limpia
  const COMPLETA = host.dataset.final === "completa";
  const DESTINO = COMPLETA ? -7 : 0; // nivel final de la ventana (0 = anillo exterior del isotipo)

  // tiempos (ms)
  const DIBUJO = 1600;   // duración del dibujo de las curvas
  const PAUSA = 150;
  const REVELA = COMPLETA ? 2800 : 2400; // duración de la revelación de la foto
  const FIN = DIBUJO + PAUSA + REVELA;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const el = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const { anillo, trazo } = window.Topo; // generador compartido (js/topo.js)

  /* ---- escena SVG ---- */
  const svg = el("svg", { class: "hero__svg", "aria-hidden": "true", preserveAspectRatio: "none" });
  const uid = "ventana-" + Math.random().toString(36).slice(2, 7);
  const defs = el("defs");
  const clip = el("clipPath", { id: uid });
  const clipPath = el("path");
  clip.appendChild(clipPath);
  defs.appendChild(clip);
  svg.appendChild(defs);

  const foto = el("g", { "clip-path": `url(#${uid})` });
  const img = el("image", { href: IMG, preserveAspectRatio: "xMidYMid slice" });
  foto.appendChild(img);
  svg.appendChild(foto);

  const lineas = el("g", { class: "hero__lineas" });
  const niveles = [];
  for (let t = 1; t >= T_MIN - 1e-6; t -= T_STEP) {
    const p = el("path", { pathLength: "1" });
    lineas.appendChild(p);
    niveles.push({ t: +t.toFixed(2), p });
  }
  svg.appendChild(lineas);
  const borde = el("path", { class: "hero__borde", pathLength: "1" });
  svg.appendChild(borde);
  host.appendChild(svg);

  /* ---- encuadre responsivo ---- */
  let W = 0, H = 0, encuadre = { s: 1, tx: 0, ty: 0 };
  function medir() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    img.setAttribute("x", 0);
    img.setAttribute("y", 0);
    img.setAttribute("width", W);
    img.setAttribute("height", H);
    const angosto = W < 760;
    // la isla ocupa buena parte de la portada, bajo el header y algo cargada a la derecha
    const s = angosto ? Math.min((W * 0.95) / BOX_W, (H * 0.6) / BOX_H) : Math.min((W * 0.68) / BOX_W, (H * 0.8) / BOX_H);
    const tx = angosto ? (W - BOX_W * s) / 2 : (W - BOX_W * s) / 2 + W * 0.09;
    const ty = angosto ? H * 0.3 : (H - BOX_H * s) / 2 + H * 0.08;
    encuadre = { s, tx, ty };
  }
  medir();
  new ResizeObserver(medir).observe(host);

  /* ---- parallax con el mouse ---- */
  let mx = 0, my = 0, px = 0, py = 0;
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  });
  host.addEventListener("pointerleave", () => { mx = 0; my = 0; });

  /* ---- línea de tiempo ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let visto = false;
  try { visto = sessionStorage.getItem("me-hero-visto") === "1"; } catch (e) {}
  if (new URLSearchParams(location.search).has("intro")) visto = false; // index.html?intro fuerza la secuencia completa
  let inicio = performance.now();
  if (visto || reduce) inicio -= FIN; // directo al estado final
  // La intro se ve completa la primera vez: el scroll queda bloqueado mientras dura
  // y se libera al terminar (no se puede saltar con scroll, clic ni teclado).
  const TECLAS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"];
  const frenar = (e) => e.preventDefault();
  const frenarTecla = (e) => { if (TECLAS.includes(e.key)) e.preventDefault(); };
  let bloqueado = false;
  const bloquear = () => {
    bloqueado = true;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.classList.add("scroll-bloqueado");
    window.addEventListener("wheel", frenar, { passive: false });
    window.addEventListener("touchmove", frenar, { passive: false });
    window.addEventListener("keydown", frenarTecla);
  };
  const quitarSaltos = () => {
    if (!bloqueado) return;
    bloqueado = false;
    document.documentElement.classList.remove("scroll-bloqueado");
    window.removeEventListener("wheel", frenar);
    window.removeEventListener("touchmove", frenar);
    window.removeEventListener("keydown", frenarTecla);
  };
  if (!(visto || reduce)) bloquear();
  host.classList.add("is-animando");

  function frame(now) {
    const ms = now - inicio;
    const T = reduce ? 0 : now / 1000;
    // parallax con inercia
    px += (mx - px) * 0.05;
    py += (my - py) * 0.05;

    // 1) dibujo de las curvas: del núcleo hacia afuera
    // 2) nivel de la ventana: de 1.05 (cerrada) al DESTINO
    const r = easeInOut(clamp((ms - DIBUJO - PAUSA) / REVELA));
    const nivel = 1.05 + (DESTINO - 1.05) * r;
    // el degradado del header entra cuando la foto ya ocupa casi toda la portada
    if (COMPLETA) host.classList.toggle("is-completa", r > 0.5);
    // logo y menú aparecen junto con el degradado (o al terminar, en modo isla)
    if ((COMPLETA ? r > 0.5 : ms >= FIN) && document.documentElement.classList.contains("hero-intro")) {
      document.documentElement.classList.remove("hero-intro");
    }

    niveles.forEach(({ t, p }, i) => {
      const prof = 1 + (1 - t) * 0.6; // las curvas exteriores se mueven más (profundidad)
      const f = { s: encuadre.s, tx: encuadre.tx + px * 18 * prof, ty: encuadre.ty + py * 12 * prof };
      p.setAttribute("d", trazo(anillo(t, T), f));
      const dibujo = easeOut(clamp((ms - i * 55) / 900));
      p.style.strokeDashoffset = 1 - dibujo;
      // las curvas que quedan dentro de la ventana se apagan: adentro manda la foto
      const dentro = clamp(1 - (t - nivel) / 0.12);
      p.style.opacity = (0.55 * dentro * (t < 0 ? 0.75 : 1)).toFixed(3);
    });

    // ventana (clip) y su borde, con la misma profundidad que su nivel
    const profV = 1 + (1 - nivel) * 0.6;
    const fV = { s: encuadre.s, tx: encuadre.tx + px * 18 * profV, ty: encuadre.ty + py * 12 * profV };
    const forma = anillo(nivel, T);
    const d = trazo(forma, fV);
    clipPath.setAttribute("d", r > 0 ? d : "M0 0Z");
    borde.setAttribute("d", d);
    // en modo completa el borde se desvanece mientras la ventana sale de cuadro
    borde.style.opacity = r > 0 ? clamp(r * 4) * (COMPLETA ? clamp((1 - r) * 2.5) : 1) : 0;
    // la foto aparece con un fundido (0 → 1) en el primer tramo de la revelación, no de golpe
    foto.style.opacity = easeOut(clamp((ms - DIBUJO - PAUSA) / 1400)).toFixed(3);
    // la foto entra con un zoom leve que se asienta
    const z = 1.12 - 0.12 * r;
    img.setAttribute("transform", `translate(${(W * (1 - z)) / 2} ${(H * (1 - z)) / 2}) scale(${z})`);

    if (ms >= FIN && host.classList.contains("is-animando")) {
      host.classList.remove("is-animando");
      quitarSaltos();
      try { sessionStorage.setItem("me-hero-visto", "1"); } catch (e) {}
    }
    if (COMPLETA && ms >= FIN) {
      // foto limpia a pantalla completa: se quita la máscara y se detiene la animación
      foto.removeAttribute("clip-path");
      img.removeAttribute("transform");
      lineas.style.display = borde.style.display = "none";
      host.classList.add("is-completa");
      raf = -1; // terminado: no se reanuda
      return;
    }
    if (!reduce) raf = enPantalla ? requestAnimationFrame(frame) : 0;
  }

  let raf = 0, enPantalla = true;
  raf = requestAnimationFrame(frame);
  new IntersectionObserver(([e]) => {
    enPantalla = e.isIntersecting;
    if (enPantalla && raf === 0 && !reduce) raf = requestAnimationFrame(frame);
  }).observe(host);
})();
