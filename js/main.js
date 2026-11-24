/* Museologías Expandidas — comportamiento compartido del prototipo */
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];


  /* ---------- Marquee: duplicar contenido para loop continuo ---------- */
  $$(".marquee__track").forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Ruleta (home) ----------
     8 casos, solo texto. El indicador está a la izquierda, centrado en altura:
     el caso que queda ahí se lee en horizontal. Al detenerse, el caso se marca
     y aparece bajo la ruleta un único botón "Ver proyecto".
     También se puede hacer clic en un caso para que la ruleta gire hasta él. */
  const ruleta = $("[data-ruleta]");
  if (ruleta && window.PROYECTOS) {
    const CASOS = 8;
    const items = window.PROYECTOS.slice(0, CASOS);
    const n = items.length;
    const S = 700, C = S / 2, R = 322, CY = C + 20;
    const step = 360 / n;
    const svg = document.createElementNS(SVGNS, "svg");
    // margen simétrico a ambos lados (el izquierdo aloja el indicador): así la rueda queda centrada
    // en el SVG y el botón "Ver proyecto" se alinea con su centro
    svg.setAttribute("viewBox", `-30 0 ${S + 60} ${S + 20}`);
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Ruleta de proyectos");
    const wheel = document.createElementNS(SVGNS, "g");
    wheel.setAttribute("class", "ruleta__wheel");
    // el eje de giro es el centro real de la ruleta (no el centro del viewBox), así rota sin desplazarse
    wheel.style.transformOrigin = `${C}px ${CY}px`;
    const polar = (deg, r) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [C + r * Math.cos(a), CY + r * Math.sin(a)];
    };
    const corto = (s, max = 26) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);
    items.forEach((p, i) => {
      const a0 = i * step - step / 2;
      const [x0, y0] = polar(a0, R);
      const [x1, y1] = polar(a0 + step, R);
      const seg = document.createElementNS(SVGNS, "g");
      seg.setAttribute("class", "ruleta__seg");
      seg.setAttribute("role", "button");
      seg.setAttribute("tabindex", "0");
      seg.setAttribute("aria-label", `${p.nombre}, ${p.fecha}`);
      seg.dataset.index = i;
      const path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", `M${C} ${CY}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`);
      path.setAttribute("class", "ruleta__fill");
      seg.appendChild(path);
      // texto radial orientado para leerse en horizontal cuando el caso llega al indicador (izquierda)
      const mid = i * step;
      const [tx, ty] = polar(mid, R * 0.7);
      const text = document.createElementNS(SVGNS, "text");
      text.setAttribute("x", tx);
      text.setAttribute("y", ty);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("transform", `rotate(${mid + 90} ${tx} ${ty})`);
      // los nombres largos van en dos líneas para no chocar con el botón central ni el borde
      const nombre = corto(p.nombre, 40);
      const palabras = nombre.split(" ");
      if (nombre.length > 18 && palabras.length > 1) {
        let mejor = 1, dif = Infinity;
        for (let k = 1; k < palabras.length; k++) {
          const d = Math.abs(palabras.slice(0, k).join(" ").length - palabras.slice(k).join(" ").length);
          if (d < dif) { dif = d; mejor = k; }
        }
        [palabras.slice(0, mejor).join(" "), palabras.slice(mejor).join(" ")].forEach((linea, k) => {
          const ts = document.createElementNS(SVGNS, "tspan");
          ts.setAttribute("x", tx);
          ts.setAttribute("dy", k === 0 ? "-0.6em" : "1.2em");
          ts.textContent = linea;
          text.appendChild(ts);
        });
      } else {
        text.textContent = nombre;
      }
      seg.appendChild(text);
      wheel.appendChild(seg);
    });
    svg.appendChild(wheel);
    // indicador: a la izquierda, centrado en altura, apuntando hacia la ruleta
    const pin = document.createElementNS(SVGNS, "path");
    pin.setAttribute("d", `M${C} ${48}c-9 -12 -17 -19 -17 -30a17 17 0 1 1 34 0c0 11 -8 18 -17 30z`);
    pin.setAttribute("transform", `rotate(-90 ${C} ${CY})`);
    pin.setAttribute("fill", "#fff");
    svg.appendChild(pin);
    ruleta.prepend(svg);

    const zona = ruleta.closest(".ruleta-zona");
    const ficha = $(".ruleta__ficha");
    const btn = $(".ruleta__btn", ruleta);
    // posición inicial: el primer caso queda en el indicador
    let angle = 270, girando = false;
    wheel.style.transform = `rotate(${angle}deg)`;

    const mostrarFicha = (p) => {
      ficha.classList.remove("is-cambiando");
      ficha.innerHTML = `<a class="ruleta__ir" href="proyecto.html" aria-label="Ver proyecto: ${p.nombre}">Ver proyecto <span aria-hidden="true">→</span></a>`;
      zona.classList.add("con-ficha");
    };

    const girarA = (target, vueltas) => {
      if (girando) return;
      girando = true;
      btn.disabled = true;
      // mientras gira, el botón del caso anterior se oculta
      ficha.classList.add("is-cambiando");
      $$(".ruleta__seg", wheel).forEach((s) => s.classList.remove("is-selected"));
      // girar para que el caso "target" quede en el indicador (izquierda = 270°)
      const current = ((angle % 360) + 360) % 360;
      const want = (((270 - target * step) % 360) + 360) % 360;
      let delta = want - current;
      if (delta < 0) delta += 360;
      angle += 360 * vueltas + delta;
      wheel.style.transform = `rotate(${angle}deg)`;
      const done = (e) => {
        if (e && e.target !== wheel) return;
        wheel.removeEventListener("transitionend", done);
        girando = false;
        btn.disabled = false;
        wheel.children[target].classList.add("is-selected");
        mostrarFicha(items[target]);
      };
      wheel.addEventListener("transitionend", done);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(done, 50);
    };

    btn.addEventListener("click", () => {
      let target = Math.floor(Math.random() * n);
      const actual = $(".ruleta__seg.is-selected", wheel);
      if (actual && +actual.dataset.index === target) target = (target + 1 + Math.floor(Math.random() * (n - 1))) % n; // no repetir
      girarA(target, 4);
    });
    // clic (o Enter) en un caso: la ruleta gira hasta él
    $$(".ruleta__seg", wheel).forEach((seg) => {
      const elegir = () => girarA(+seg.dataset.index, 1);
      seg.addEventListener("click", elegir);
      seg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(); } });
    });
  }

  /* ---------- Fichero de archivo (opción 2 de la Home) ----------
     Un cajón con una ficha por proyecto; las pestañas asoman escalonadas.
     "Sacar una ficha" hojea el cajón y saca una al azar; también se puede
     sacar una a mano haciendo clic en su pestaña. La ficha sacada muestra
     fecha, nombre y "Ver proyecto". */
  const fichero = $("[data-fichero]");
  if (fichero && window.PROYECTOS) {
    const FICHAS = 12;
    const items = window.PROYECTOS.slice(0, FICHAS);
    const cartas = $(".fichero__cartas", fichero);
    const zonaF = fichero.closest(".fichero-zona");
    const btnF = $(".fichero__btn", zonaF);
    const avisoF = $(".fichero__aviso", zonaF);
    const corto = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);
    // la ficha 0 queda adelante; las de atrás suben un poco y escalonan sus pestañas en 3 columnas
    items.forEach((p, i) => {
      const f = document.createElement("div");
      f.className = "tarjeta";
      f.style.setProperty("--i", i);
      f.style.zIndex = FICHAS - i;
      f.innerHTML = `
        <button class="tarjeta__pestana" type="button" style="--col:${i % 3}" aria-label="Sacar la ficha: ${p.nombre}">${corto(p.nombre, 18)}</button>
        <div class="tarjeta__cuerpo">
          <span class="tarjeta__fecha">${p.fecha}</span>
          <h3 class="tarjeta__nombre">${p.nombre}</h3>
          <a class="tarjeta__ir" href="proyecto.html" tabindex="-1">Ver proyecto <span aria-hidden="true">→</span></a>
        </div>`;
      cartas.appendChild(f);
    });
    const fichas = $$(".tarjeta", cartas);
    let ocupado = false;

    const sacar = (i) => {
      fichas.forEach((f, k) => {
        const fuera = k === i;
        f.classList.toggle("is-fuera", fuera);
        $(".tarjeta__ir", f).tabIndex = fuera ? 0 : -1;
      });
      fichero.classList.add("con-ficha");
      avisoF.textContent = `Ficha: ${items[i].nombre}, ${items[i].fecha}`;
    };
    const guardar = () => {
      fichas.forEach((f) => { f.classList.remove("is-fuera"); $(".tarjeta__ir", f).tabIndex = -1; });
      fichero.classList.remove("con-ficha");
    };

    // hojear: varias fichas se levantan y bajan rápido, como al buscar con los dedos
    const hojear = (alTerminar) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return alTerminar();
      const pasos = 14;
      let k = 0;
      const tic = () => {
        const f = fichas[Math.floor(Math.random() * fichas.length)];
        f.classList.add("is-hojeada");
        setTimeout(() => f.classList.remove("is-hojeada"), 140);
        k++;
        if (k < pasos) setTimeout(tic, 70 + k * 6); // se va frenando
        else setTimeout(alTerminar, 260);
      };
      tic();
    };

    btnF.addEventListener("click", () => {
      if (ocupado) return;
      ocupado = true;
      btnF.disabled = true;
      const anterior = fichas.findIndex((f) => f.classList.contains("is-fuera"));
      guardar();
      setTimeout(() => hojear(() => {
        let i = Math.floor(Math.random() * fichas.length);
        if (i === anterior) i = (i + 1 + Math.floor(Math.random() * (fichas.length - 1))) % fichas.length; // no repetir
        sacar(i);
        ocupado = false;
        btnF.disabled = false;
      }), anterior >= 0 ? 380 : 0);
    });
    // sacar una ficha a mano desde su pestaña
    fichas.forEach((f, i) => {
      $(".tarjeta__pestana", f).addEventListener("click", () => {
        if (ocupado) return;
        if (f.classList.contains("is-fuera")) return guardar();
        sacar(i);
      });
    });
  }

  /* ---------- Selector Ruleta / Fichero (Home) ---------- */
  const selector = $(".selector-modo");
  if (selector) {
    const opciones = $$(".selector-modo__opcion", selector);
    const paneles = $$("[data-modo-panel]");
    const activar = (modo) => {
      opciones.forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.modo === modo)));
      paneles.forEach((p) => { p.hidden = p.dataset.modoPanel !== modo; });
      try { localStorage.setItem("me-modo-explorar", modo); } catch (e) {}
    };
    opciones.forEach((o) => o.addEventListener("click", () => activar(o.dataset.modo)));
    let guardado = null;
    try { guardado = localStorage.getItem("me-modo-explorar"); } catch (e) {}
    if (guardado === "fichero" || guardado === "ruleta") activar(guardado);
  }

  /* ---------- Grilla Explorar proyectos ---------- */
  const grid = $("[data-grid-proyectos]");
  if (grid && window.PROYECTOS) {
    // 12 proyectos por página = 6 filas completas de la grilla (2 proyectos por fila)
    const POR_PAGINA = 12;
    const total = window.PROYECTOS.length;
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const pedida = parseInt(new URLSearchParams(location.search).get("pagina"), 10) || 1;
    const pagina = Math.min(Math.max(1, pedida), paginas);
    const desde = (pagina - 1) * POR_PAGINA;
    const colores = ["c-naranjo", "c-azul", "c-crema", "c-petroleo", "c-naranjo", "c-crema", "c-crema", "c-petroleo"];

    window.PROYECTOS.slice(desde, desde + POR_PAGINA).forEach((p, i) => {
      const row = Math.floor(i / 2);
      const img = `<div class="tile tile--img"><img src="${p.img}" alt="" loading="lazy"></div>`;
      const card = `<div class="tile tile--card ${colores[(desde + i) % colores.length]}">
          <span class="fecha">${p.fecha}</span>
          <h2>${p.nombre}</h2>
          <span class="ver" aria-hidden="true"><span class="ver__texto">ver</span><svg class="ver__icono" viewBox="0 0 30 14"><path class="ver__h" d="M8 7H28.5"/><path class="ver__v" d="M22.5 1V13"/><path class="ver__punta" d="M23 1.5L28.5 7L23 12.5"/></svg></span>
        </div>`;
      // todo el proyecto (foto + recuadro) es un solo enlace al detalle;
      // filas pares: imagen + tarjeta; filas impares: tarjeta + imagen (ajedrez)
      grid.insertAdjacentHTML(
        "beforeend",
        `<a class="proyecto" href="proyecto.html" aria-label="${p.nombre}, ${p.fecha}">${row % 2 === 0 ? img + card : card + img}</a>`
      );
    });

    // paginación (solo si hay más de una página)
    if (paginas > 1) {
      const url = (n) => (n === 1 ? "proyectos.html" : `proyectos.html?pagina=${n}`);
      const dos = (n) => String(n).padStart(2, "0");
      let html = `<nav class="paginacion" aria-label="Páginas de proyectos">`;
      html += pagina > 1
        ? `<a class="paginacion__flecha" href="${url(pagina - 1)}" aria-label="Página anterior">←</a>`
        : `<span class="paginacion__flecha is-off" aria-hidden="true">←</span>`;
      for (let n = 1; n <= paginas; n++) {
        html += n === pagina
          ? `<span class="paginacion__num is-actual" aria-current="page">${dos(n)}</span>`
          : `<a class="paginacion__num" href="${url(n)}" aria-label="Página ${n}">${dos(n)}</a>`;
      }
      html += pagina < paginas
        ? `<a class="paginacion__flecha" href="${url(pagina + 1)}" aria-label="Página siguiente">→</a>`
        : `<span class="paginacion__flecha is-off" aria-hidden="true">→</span>`;
      html += `<span class="paginacion__info">${desde + 1}–${Math.min(desde + POR_PAGINA, total)} de ${total} proyectos</span></nav>`;
      grid.insertAdjacentHTML("afterend", html);
    }
  }

  /* ---------- Detalle: índice lateral con sección activa ---------- */
  const indice = $(".indice");
  if (indice) {
    const links = $$("a", indice);
    const detalle = $(".detalle");
    const secciones = links.map((a) => $(a.getAttribute("href")));
    const setActive = () => {
      const y = window.innerHeight * 0.35;
      let active = 0;
      secciones.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= y) active = i;
      });
      links.forEach((a, i) => a.classList.toggle("is-active", i === active));
      detalle.dataset.tema = secciones[active].id;
    };
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  /* ---------- Fotos del detalle: fondo plano + visor ampliado ---------- */
  // Por ahora cada foto es un espacio oscuro (.foto, con su proporción en --ratio);
  // el visor muestra ese espacio en grande con su descripción.
  const fotos = $$(".secciones .foto:not(.foto--fija)"); // .foto--fija: no se amplía (ej. la del archivo)
  if (fotos.length) {
    fotos.forEach((b, i) => { b.dataset.i = i; });
    const visor = document.createElement("div");
    visor.className = "visor";
    visor.setAttribute("role", "dialog");
    visor.setAttribute("aria-modal", "true");
    visor.setAttribute("aria-label", "Foto ampliada");
    visor.innerHTML = `
      <button class="visor__btn visor__cerrar" type="button" aria-label="Cerrar">✕</button>
      <button class="visor__btn visor__ant" type="button" aria-label="Foto anterior">←</button>
      <div class="visor__img" role="img"></div>
      <button class="visor__btn visor__sig" type="button" aria-label="Foto siguiente">→</button>
      <p class="visor__pie"></p>`;
    document.body.appendChild(visor);
    const vImg = $(".visor__img", visor), vPie = $(".visor__pie", visor);
    let actual = 0, origen = null;
    const pie = (b) => {
      // pie: la bajada de la foto si tiene una al lado; si no, su descripción
      const bajada = b.closest(".foto-bajada")?.querySelector(".bajada");
      return bajada ? bajada.textContent : b.dataset.desc || "";
    };
    const mostrar = (i) => {
      actual = (i + fotos.length) % fotos.length;
      const b = fotos[actual];
      const ratio = (getComputedStyle(b).getPropertyValue("--ratio") || "4 / 3").trim();
      const [rw, rh] = ratio.split("/").map(parseFloat);
      vImg.style.setProperty("--ratio", ratio);
      vImg.style.setProperty("--ratio-n", (rw / (rh || 1)).toFixed(4)); // para calcular el tamaño máximo
      vImg.setAttribute("aria-label", b.dataset.desc || "Foto");
      vImg.dataset.n = `Foto ${actual + 1} de ${fotos.length}`;
      vPie.textContent = pie(b);
    };
    const abrir = (i, desde) => {
      origen = desde;
      mostrar(i);
      visor.classList.add("is-abierto");
      document.documentElement.classList.add("visor-abierto");
      $(".visor__cerrar", visor).focus();
    };
    const cerrar = () => {
      visor.classList.remove("is-abierto");
      document.documentElement.classList.remove("visor-abierto");
      if (origen) origen.focus();
    };
    $$(".foto").forEach((b) => b.addEventListener("click", () => abrir(+b.dataset.i, b)));
    $(".visor__cerrar", visor).addEventListener("click", cerrar);
    $(".visor__ant", visor).addEventListener("click", () => mostrar(actual - 1));
    $(".visor__sig", visor).addEventListener("click", () => mostrar(actual + 1));
    visor.addEventListener("click", (e) => { if (e.target === visor) cerrar(); }); // clic en el fondo
    document.addEventListener("keydown", (e) => {
      if (!visor.classList.contains("is-abierto")) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") mostrar(actual - 1);
      if (e.key === "ArrowRight") mostrar(actual + 1);
    });
  }

  /* ---------- Audioguía (simulada, sin archivo de audio aún) ---------- */
  const audio = $("[data-audio]");
  if (audio) {
    // barra fija abajo: aparece recién al pasar la cabecera del proyecto
    document.documentElement.classList.add("con-audio");
    const cabecera = $(".hero");
    const mostrarAudio = () => {
      const limite = cabecera ? cabecera.offsetTop + cabecera.offsetHeight * 0.6 : 200;
      audio.classList.toggle("is-visible", window.scrollY > limite);
    };
    window.addEventListener("scroll", mostrarAudio, { passive: true });
    mostrarAudio();
    const total = +audio.dataset.duracion || 660;
    const playBtn = $(".audio__play", audio);
    const dot = $(".audio__dot", audio);
    const bar = $(".audio__bar", audio);
    const time = $(".audio__time", audio);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    let t = 0, timer = null;
    const render = () => {
      dot.style.left = (t / total) * 100 + "%";
      time.textContent = `${fmt(t)} - ${fmt(total)}`;
    };
    const iconPlay = '<svg viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
    const iconPause = '<svg viewBox="0 0 12 12"><path d="M3 1v10M9 1v10" stroke="currentColor" stroke-width="1.8"/></svg>';
    playBtn.innerHTML = iconPlay;
    playBtn.addEventListener("click", () => {
      if (timer) {
        clearInterval(timer); timer = null;
        playBtn.innerHTML = iconPlay;
        playBtn.setAttribute("aria-label", "Reproducir audioguía");
      } else {
        timer = setInterval(() => { t = Math.min(total, t + 1); render(); if (t >= total) playBtn.click(); }, 1000);
        playBtn.innerHTML = iconPause;
        playBtn.setAttribute("aria-label", "Pausar audioguía");
      }
    });
    bar.addEventListener("click", (e) => {
      const r = bar.getBoundingClientRect();
      t = Math.round(((e.clientX - r.left) / r.width) * total);
      render();
    });
    render();
  }

  /* ---------- Video de YouTube con vista previa ----------
     El reproductor (youtube-nocookie) se carga recién al hacer play: la página
     no descarga nada de YouTube hasta que la persona lo pide. */
  $$(".video").forEach((v) => {
    const play = () => {
      if (v.classList.contains("is-reproduciendo")) return;
      const id = (v.dataset.youtube || "").trim();
      if (!id) {
        // prototipo: aún no hay video asignado
        if (!$(".video__aviso", v)) v.insertAdjacentHTML("beforeend", '<span class="video__aviso">Video por definir</span>');
        return;
      }
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = "Video de YouTube";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      v.appendChild(iframe);
      v.classList.add("is-reproduciendo");
    };
    v.addEventListener("click", play);
  });

  /* ---------- Modal de contacto ----------
     Se abre desde cualquier enlace "Contacto" (header grande y header compacto).
     ⚠ Correo provisorio: reemplazar CONTACTO.correo por el definitivo. */
  const CONTACTO = {
    nombre: "Tatiana Wolff Rojas",
    rol: "Diseñadora y Museóloga",
    correo: "correo@dominio.cl",
  };
  const modal = document.createElement("div");
  modal.className = "modal-contacto";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modal-contacto-titulo");
  modal.innerHTML = `
    <div class="modal-contacto__panel">
      <button class="modal-contacto__cerrar" type="button" aria-label="Cerrar">✕</button>
      <div class="modal-contacto__contenido">
      <p class="modal-contacto__etiqueta">Contacto</p>
      <h2 class="modal-contacto__nombre" id="modal-contacto-titulo">${CONTACTO.nombre}</h2>
      <p class="modal-contacto__rol">${CONTACTO.rol}</p>
      <div class="modal-contacto__correo">
        <a href="mailto:${CONTACTO.correo}">${CONTACTO.correo}</a>
        <button class="modal-contacto__copiar" type="button">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>
          <span>Copiar</span>
        </button>
      </div>
      <p class="modal-contacto__aviso" aria-live="polite"></p>
      <p class="modal-contacto__o"><span>o escríbele aquí</span></p>
      <form class="form-contacto" novalidate>
        <label class="form-contacto__campo">
          <span>Nombre</span>
          <input type="text" name="nombre" autocomplete="name" required>
        </label>
        <label class="form-contacto__campo">
          <span>Correo</span>
          <input type="email" name="correo" autocomplete="email" required>
        </label>
        <label class="form-contacto__campo">
          <span>Mensaje</span>
          <textarea name="mensaje" rows="4" required></textarea>
        </label>
        <p class="form-contacto__error" aria-live="polite"></p>
        <button class="form-contacto__enviar" type="submit">Enviar mensaje <span aria-hidden="true">→</span></button>
      </form>
      </div>
      <!-- estado de éxito, después de "Enviar mensaje" -->
      <div class="modal-contacto__exito" hidden>
        <span class="modal-contacto__check" aria-hidden="true">
          <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22"/><path d="M14 25l7 7 13-15"/></svg>
        </span>
        <h2 class="modal-contacto__nombre" tabindex="-1">¡Gracias<span class="exito-nombre"></span>!</h2>
        <p class="modal-contacto__exito-texto">Tu mensaje fue enviado. Tatiana te responderá pronto a tu correo.</p>
        <button class="form-contacto__enviar modal-contacto__listo" type="button">Cerrar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const btnCopiar = $(".modal-contacto__copiar", modal);
  const aviso = $(".modal-contacto__aviso", modal);

  // Formulario de contacto.
  // ⚠ PROTOTIPO: todavía no envía el mensaje a ninguna parte; solo valida y muestra el éxito.
  // Para que llegue al correo de Tatiana, completar enviarMensaje() con un servicio de
  // formularios (p. ej. Formspree o Web3Forms): hacer el fetch y mostrar el éxito solo si responde bien.
  const enviarMensaje = async ({ nombre, correo, mensaje }) => {
    // TODO: conectar el envío real. Ejemplo con un servicio de formularios:
    // const r = await fetch("https://formspree.io/f/XXXXXXX", {
    //   method: "POST", headers: { Accept: "application/json" },
    //   body: new URLSearchParams({ nombre, correo, mensaje, _subject: `Contacto desde Museologías Expandidas — ${nombre}` }),
    // });
    // if (!r.ok) throw new Error("No se pudo enviar");
    return true;
  };
  const form = $(".form-contacto", modal);
  const errorForm = $(".form-contacto__error", form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const campos = [...form.elements].filter((el) => el.name);
    campos.forEach((el) => el.classList.remove("is-error"));
    const malos = campos.filter((el) => !el.value.trim() || !el.checkValidity());
    if (malos.length) {
      malos.forEach((el) => el.classList.add("is-error"));
      errorForm.textContent = malos.some((el) => el.type === "email" && el.value.trim())
        ? "Revisa el correo: no parece válido."
        : "Completa todos los campos para enviar.";
      malos[0].focus();
      return;
    }
    const datos = Object.fromEntries(campos.map((el) => [el.name, el.value.trim()]));
    const boton = $(".form-contacto__enviar", form);
    errorForm.textContent = "";
    boton.disabled = true;
    try {
      await enviarMensaje(datos);
      mostrarExito(datos.nombre);
    } catch (err) {
      errorForm.textContent = "No se pudo enviar el mensaje. Inténtalo de nuevo o escríbele directamente al correo.";
    } finally {
      boton.disabled = false;
    }
  });

  // estado de éxito: reemplaza el contenido del modal; al cerrar, el modal vuelve a su estado inicial
  const contenido = $(".modal-contacto__contenido", modal);
  const exito = $(".modal-contacto__exito", modal);
  const mostrarExito = (nombre) => {
    $(".exito-nombre", exito).textContent = nombre ? `, ${nombre.split(" ")[0]}` : "";
    contenido.hidden = true;
    exito.hidden = false;
    $(".modal-contacto__panel", modal).scrollTop = 0;
    $(".modal-contacto__nombre", exito).focus();
  };
  const reiniciarModal = () => {
    form.reset();
    errorForm.textContent = "";
    aviso.textContent = "";
    contenido.hidden = false;
    exito.hidden = true;
  };
  $(".modal-contacto__listo", exito).addEventListener("click", () => cerrarModal());
  let origenModal = null;
  const abrirModal = (e, enlace) => {
    e.preventDefault();
    origenModal = enlace;
    aviso.textContent = "";
    modal.classList.add("is-abierto");
    document.documentElement.classList.add("visor-abierto"); // bloquea el scroll de fondo
    $(".modal-contacto__cerrar", modal).focus();
  };
  const cerrarModal = () => {
    modal.classList.remove("is-abierto");
    document.documentElement.classList.remove("visor-abierto");
    if (!exito.hidden) setTimeout(reiniciarModal, 350); // tras el éxito, la próxima vez parte de cero
    if (origenModal) origenModal.focus();
  };
  // delegado: sirve también para el enlace del header compacto, que se crea después
  document.addEventListener("click", (e) => {
    const enlace = e.target.closest('a[href="#contacto"]');
    if (enlace) abrirModal(e, enlace);
  });
  $(".modal-contacto__cerrar", modal).addEventListener("click", cerrarModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-abierto")) return;
    if (e.key === "Escape") cerrarModal();
    if (e.key === "Tab") {
      // mantener el foco dentro del modal
      const focos = $$("button, a", modal);
      const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });
  btnCopiar.addEventListener("click", async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(CONTACTO.correo); ok = true; }
    catch (err) {
      // respaldo para navegadores sin acceso al portapapeles
      const t = document.createElement("textarea");
      t.value = CONTACTO.correo; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand("copy"); } catch (e2) {}
      t.remove();
    }
    aviso.textContent = ok ? "Correo copiado al portapapeles" : "No se pudo copiar; selecciona el correo y cópialo";
    btnCopiar.classList.toggle("is-copiado", ok);
    $("span", btnCopiar).textContent = ok ? "Copiado" : "Copiar";
    clearTimeout(btnCopiar._t);
    btnCopiar._t = setTimeout(() => { btnCopiar.classList.remove("is-copiado"); $("span", btnCopiar).textContent = "Copiar"; }, 2500);
  });

  /* ---------- Header compacto fijo ----------
     Aparece una vez pasada la portada (o el header, en páginas sin portada).
     Se esconde al bajar y vuelve al subir. */
  const headerPrincipal = $(".site-header");
  if (headerPrincipal) {
    const navLinks = $$(".site-nav a", headerPrincipal)
      .map((a) => `<a href="${a.getAttribute("href")}"${a.hasAttribute("aria-current") ? ' aria-current="page"' : ""}>${a.textContent}</a>`)
      .join("");
    const fijo = document.createElement("div");
    fijo.className = "header-fijo";
    fijo.innerHTML = `<div class="header-fijo__inner">
        <a class="header-fijo__logo" href="index.html"><img src="assets/logos/logo-letras-blanco.png" alt="Museologías Expandidas — inicio" width="1399" height="255"></a>
        <nav class="site-nav" aria-label="Principal (barra fija)">${navLinks}</nav>
      </div>`;
    document.body.appendChild(fijo);

    const portada = $(".hero");
    const umbral = () => (portada ? portada.offsetTop + portada.offsetHeight : headerPrincipal.offsetHeight) - 80;
    let ultimoY = window.scrollY;
    const mostrar = (si) => {
      fijo.classList.toggle("is-visible", si);
      document.documentElement.classList.toggle("header-fijo-visible", si);
    };
    const revisar = () => {
      const y = window.scrollY;
      if (y < umbral()) mostrar(false);           // aún en la portada: solo el header grande
      else if (y < ultimoY - 6) mostrar(true);    // subiendo: aparece
      else if (y > ultimoY + 6) mostrar(false);   // bajando: se esconde
      if (Math.abs(y - ultimoY) > 6) ultimoY = y;
    };
    window.addEventListener("scroll", revisar, { passive: true });
  }

  /* ---------- Entradas suaves al hacer scroll ---------- */
  const REVEAL = [
    ".intro__head", ".intro__text", ".intro__grid .ph", ".intro__grid .video",
    ".grid-proyectos .tile",
    ".ficha", ".bloque > *",
    ".site-footer__logo",
  ].join(",");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => {
      // lo que entra junto se escalona: de arriba hacia abajo y de izquierda a derecha
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e, i) => {
          e.target.style.setProperty("--reveal-delay", Math.min(i * 110, 660) + "ms");
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(REVEAL).forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
    // al llegar al final de la página se muestra todo lo pendiente:
    // lo último de la página puede no alcanzar a subir lo suficiente para activarse
    const alFinal = () => {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
      $$(".reveal:not(.is-in)").forEach((el) => { el.classList.add("is-in"); io.unobserve(el); });
    };
    window.addEventListener("scroll", alFinal, { passive: true });
  }
})();
