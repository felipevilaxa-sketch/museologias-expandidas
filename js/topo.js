/* Museologías Expandidas — generador de curvas de nivel (recreación del isotipo)
   Compartido por la portada (hero.js) y la textura de la sección crema (intro.js).

   Topo.anillo(t, T) → puntos de una curva cerrada para el nivel t en el instante T (s).
     t = 1 es el núcleo, t = 0 el anillo exterior del isotipo, t < 0 curvas más amplias.
     Espacio de diseño: 620 × 420 (Topo.BOX_W × Topo.BOX_H).
   Topo.trazo(pts, {s, tx, ty}) → atributo "d" de una curva suave escalada y desplazada. */
window.Topo = (function () {
  const TAU = Math.PI * 2;
  const N = 96; // puntos por curva
  const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x)); // ángulo a [-π, π]

  function anillo(t, T) {
    // más allá del isotipo (t<0) el centro deja de desplazarse: los anillos crecen parejo
    const tc = Math.max(t, -0.3);
    const cx = 205 + 100 * tc + 6 * Math.sin(T * 0.31 + t * 3.5);
    const cy = 220 - 55 * tc + 4 * Math.cos(T * 0.23 + t * 3);
    const R = 205 - 140 * t;
    const sq = Math.min(0.86, 0.8 - 0.28 * t);                   // el núcleo es más achatado
    const tail = 0.85 * Math.pow(Math.max(0, 1 - t), 1.1) + 0.12; // cola hacia abajo-derecha
    const dir = 0.3 + 0.05 * Math.sin(T * 0.19 + t * 1.2);
    const pts = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * TAU;
      const lobe = 0.16 * (1 - 0.6 * t) * Math.exp(-Math.pow(wrap(a - 2.25) / 0.75, 2)); // lóbulo abajo-izquierda
      const loma = 0.1 * (1 - t) * Math.exp(-Math.pow(wrap(a + 1.7) / 0.6, 2));          // loma superior
      const n =
        0.07 * Math.sin(2 * a + 0.6 + T * 0.34 + t * 1.6) +
        0.045 * Math.sin(3 * a - 1.2 - T * 0.26 + t * 2.2) +
        0.025 * Math.sin(5 * a + 2.0 + T * 0.47 + t * 3);
      const stretch = 1 + tail * Math.exp(-Math.pow(Math.abs(wrap(a - dir)) / 0.55, 2));
      const r = R * (1 + n + lobe + loma) * stretch;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a) * sq]);
    }
    return pts;
  }

  // curva cerrada suave (Catmull-Rom → Bézier), con escala y desplazamiento aplicados
  function trazo(pts, f) {
    const P = pts.map(([x, y]) => [f.tx + x * f.s, f.ty + y * f.s]);
    const n = P.length, q = (v) => v.toFixed(1);
    let d = `M${q(P[0][0])} ${q(P[0][1])}`;
    for (let k = 0; k < n; k++) {
      const p0 = P[(k - 1 + n) % n], p1 = P[k], p2 = P[(k + 1) % n], p3 = P[(k + 2) % n];
      d += `C${q(p1[0] + (p2[0] - p0[0]) / 6)} ${q(p1[1] + (p2[1] - p0[1]) / 6)} ${q(p2[0] - (p3[0] - p1[0]) / 6)} ${q(p2[1] - (p3[1] - p1[1]) / 6)} ${q(p2[0])} ${q(p2[1])}`;
    }
    return d + "Z";
  }

  return { anillo, trazo, BOX_W: 620, BOX_H: 420 };
})();
