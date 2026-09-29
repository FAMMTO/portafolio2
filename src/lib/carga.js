import { supabase } from './supabase.js';

// Carga central del sitio: una sola consulta por tabla, compartida por todos los componentes,
// más la precarga de imágenes y fuentes. El telón de intro espera a que todo esto termine.

let datosP = null;

// Consultas a Supabase (memoizadas: la primera llamada dispara las 3, las demás reutilizan el resultado).
// Solo corre en el navegador; en el build (SSR) no se llama.
export function obtenerDatos() {
  if (!datosP) {
    const q = (promesa, etiqueta) =>
      promesa.then(({ data, error }) => {
        if (error) console.error(`Error cargando ${etiqueta}:`, error.message);
        return error ? null : data;
      });
    datosP = Promise.all([
      q(supabase.from('proyectos').select('*').order('orden', { ascending: true }), 'proyectos'),
      q(supabase.from('perfil').select('*').eq('id', 1).maybeSingle(), 'perfil'),
      q(
        supabase.from('trayectoria').select('*')
          .order('fecha_inicio', { ascending: false }).order('orden', { ascending: false }),
        'trayectoria'
      ),
    ]).then(([proyectos, perfil, trayectoria]) => ({ proyectos, perfil, trayectoria }));
  }
  return datosP;
}

// Descarga y decodifica una imagen para que ya esté en caché cuando el <img> real la pida.
const precargarImagen = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

const TOPE_MS = 8000; // nunca dejar el telón más de esto, aunque algo tarde o falle

let listoP = null;

// Arranca la carga completa. onProgreso(0..1) se llama cada vez que termina una tarea.
// Resuelve cuando todo terminó (o al llegar al tope) y marca window.__appLista + evento 'app-lista'.
export function iniciarCarga(onProgreso = () => {}) {
  if (listoP) return listoP;
  let total = 2; // datos + fuentes; las imágenes se suman al conocer la lista
  let hechas = 0;
  const tick = () => { hechas++; onProgreso(Math.min(hechas / total, 1)); };

  const fuentes = (document.fonts?.ready ?? Promise.resolve()).then(tick);

  // El telón espera las portadas (se ven en el carrusel al instante). Las imágenes de galería
  // solo aparecen al abrir un proyecto: se precargan en segundo plano sin retrasar la entrada.
  const datosEImagenes = obtenerDatos().then((d) => {
    const portadas = new Set();
    const galerias = new Set();
    (d.proyectos || []).forEach((p) => {
      if (p.imagen_principal) portadas.add(p.imagen_principal);
      (p.imagenes_secundarias || []).forEach((u) => u && galerias.add(u));
    });
    portadas.forEach((u) => galerias.delete(u));
    total += portadas.size; // sumar antes de marcar los datos, para que la barra no salte a 100%
    tick();
    return Promise.all([...portadas].map((u) => precargarImagen(u).then(tick))).then(() => galerias);
  });

  const tope = new Promise((r) => setTimeout(r, TOPE_MS));
  listoP = Promise.race([Promise.all([fuentes, datosEImagenes]), tope]).then(() => {
    onProgreso(1);
    window.__appLista = true;
    window.dispatchEvent(new Event('app-lista'));
  });
  // Galerías en segundo plano, cuando el navegador esté libre tras la entrada.
  Promise.all([datosEImagenes, listoP]).then(([galerias]) => {
    const precargar = () => galerias.forEach((u) => precargarImagen(u));
    ('requestIdleCallback' in window) ? requestIdleCallback(precargar, { timeout: 3000 }) : setTimeout(precargar, 1000);
  });
  return listoP;
}

// Ejecuta cb cuando termina la intro (telón retirado). Sirve para arrancar animaciones del hero.
export function alTerminarIntro(cb) {
  if (window.__introFin) { cb(); return () => {}; }
  window.addEventListener('intro-fin', cb, { once: true });
  return () => window.removeEventListener('intro-fin', cb);
}
