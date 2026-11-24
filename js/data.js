// Datos de ejemplo de proyectos (placeholder hasta tener el listado real).
// Todos enlazan al proyecto de ejemplo (proyecto.html) en esta versión.
// La ruleta de la Home usa los primeros 8; "desc" es la descripción breve de su ficha.
const DESC_PROVISORIA = "Descripción breve del proyecto: contexto, comunidad o institución con que se trabajó y qué se hizo. Texto provisorio.";
window.PROYECTOS = [
  {
    id: "fasic",
    nombre: "Exposición Principal FASIC",
    fecha: "2016 / 2021",
    img: "assets/img/archivo-pasaportes.jpg",
    desc: "Desarrollo curatorial y museográfico de la exposición permanente de la Fundación de Ayuda Social de las Iglesias Cristianas, a partir de su archivo de derechos humanos.",
  },
  { id: "p02", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/obra-pintura.jpg", desc: DESC_PROVISORIA },
  { id: "p03", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/fasic-fachada.jpg", desc: DESC_PROVISORIA },
  { id: "p04", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/taller-piso.jpg", desc: DESC_PROVISORIA },
  { id: "p05", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/fasic-sala.jpg", desc: DESC_PROVISORIA },
  { id: "p06", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/expo-sala-1.jpg", desc: DESC_PROVISORIA },
  { id: "p07", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/obra-pintura.jpg", desc: DESC_PROVISORIA },
  { id: "p08", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/expo-sala-2.jpg", desc: DESC_PROVISORIA },
  { id: "p09", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/expo-sala-2.jpg", desc: DESC_PROVISORIA },
  { id: "p10", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/taller-piso.jpg", desc: DESC_PROVISORIA },
  { id: "p11", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/fasic-fachada.jpg", desc: DESC_PROVISORIA },
  { id: "p12", nombre: "Nombre proyecto", fecha: "Fecha", img: "assets/img/archivo-pasaportes.jpg", desc: DESC_PROVISORIA },
];

// Relleno provisorio hasta 20 proyectos (el sitio reúne "cerca de veinte"), para probar la paginación.
(function () {
  const fotos = ["assets/img/obra-pintura.jpg", "assets/img/fasic-sala.jpg", "assets/img/taller-piso.jpg", "assets/img/expo-sala-1.jpg"];
  for (let n = window.PROYECTOS.length + 1; n <= 20; n++) {
    window.PROYECTOS.push({ id: "p" + String(n).padStart(2, "0"), nombre: "Nombre proyecto", fecha: "Fecha", img: fotos[n % fotos.length], desc: DESC_PROVISORIA });
  }
})();
