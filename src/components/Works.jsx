import { useEffect, useRef, useState } from 'react';
import { carouselBlocks } from '../data.js';
import ProjectModal from './ProjectModal.jsx';
import CodeVisual from './CodeVisual.jsx';
import { obtenerDatos } from '../lib/carga.js';
import { urlSegura } from '../lib/url.js';

const FONDOS = ['#1E2A3A', '#2B2440', '#1F3A30', '#2A2A2E', '#3A2A1E'];

// Fila de la tabla `proyectos` → forma de pin que usan el carrusel y el modal.
const aPin = (r, i) => ({
  titulo: r.nombre,
  foto: r.imagen_principal,
  galeria: r.imagenes_secundarias || [],
  descripcion: r.contexto,
  tag: r.categoria,
  stack: r.stack?.length ? r.stack : null,
  demo: urlSegura(r.link), // columna `link` → botón "Visitar sitio" en el modal (solo http/https)
  fondo: FONDOS[i % FONDOS.length],
  visual: 'ui',
  archivo: r.nombre,
});

// Velocidad del loop en px/s (1420px por bloque cada 32s).
const PX_POR_SEG = 44;

// Reparte los pins en los huecos de los layouts de carouselBlocks (en ciclo), cada proyecto una vez.
const armarBloques = (pins) => {
  const bloques = [];
  let i = 0;
  for (let b = 0; i < pins.length; b++) {
    const layout = carouselBlocks[b % carouselBlocks.length];
    const slots = layout.pins.slice(0, pins.length - i);
    bloques.push({
      cols: layout.cols,
      rows: layout.rows,
      pins: slots.map((s) => ({ ...pins[i++], col: s.col, row: s.row })),
    });
  }
  return bloques;
};

// Portada del pin: imagen principal si existe, si no el visual de código.
function PinMedia({ p, className }) {
  return (
    <div className={className} style={{ background: p.fondo }}>
      {p.foto
        ? <img src={p.foto} alt={p.titulo} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <CodeVisual visual={p.visual} archivo={p.archivo} codigo={p.codigo} compacto />}
    </div>
  );
}

// Dominio legible del link: "https://www.xdp.com.mx/" → "xdp.com.mx".
const dominio = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

// Chip con el sitio del proyecto. El pin ya es <button>, así que no puede llevar un <a> dentro:
// se usa role="link" y se abre en otra pestaña sin disparar el modal.
function PinLink({ url, oculto }) {
  if (!url) return null;
  const abrir = (e) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <span
      role="link"
      tabIndex={oculto ? -1 : 0}
      className="pin-link"
      title={url}
      onClick={abrir}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(e); } }}
    >
      {dominio(url)} <span aria-hidden="true">↗</span>
    </span>
  );
}

// Infinite masonry carousel: loops via CSS from first paint, pauses on hover (CSS).
export default function Works() {
  const sectionRef = useRef(null);
  const [bloquesDb, setBloquesDb] = useState(null); // null → usa datos estáticos de data.js
  const [selected, setSelected] = useState(null); // pin abierto en el modal
  // Proyectos de la carga central (ya precargados junto con sus imágenes durante el telón);
  // si falla o la tabla está vacía se quedan los estáticos.
  useEffect(() => {
    obtenerDatos().then(({ proyectos }) => {
      if (proyectos?.length) setBloquesDb(armarBloques(proyectos.map(aPin)));
    });
  }, []);

  const base = bloquesDb || carouselBlocks;
  // Lista plana única para el masonry vertical en móvil (estilo Pinterest).
  const pinsPlanos = base.flatMap((b) => b.pins);

  // Duración según el ancho real de una mitad → velocidad constante con cualquier número de proyectos.
  const mitadRef = useRef(null);
  const [duracion, setDuracion] = useState(64);
  useEffect(() => {
    const el = mitadRef.current;
    if (!el) return;
    const medir = () => setDuracion(Math.max(el.offsetWidth, 1) / PX_POR_SEG);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bloquesDb]);

  const renderMitad = (ref, oculta) => (
    // Cada mitad mide al menos el ancho de la pantalla: con pocos proyectos queda hueco al final,
    // pero ningún proyecto se ve dos veces a la vez.
    <div className="carousel-half" ref={ref} aria-hidden={oculta || undefined}>
      {base.map((block, bi) => (
        <div
          key={bi}
          className="carousel-block"
          style={{ gridTemplateColumns: block.cols, gridTemplateRows: block.rows }}
        >
          {block.pins.map((p, pi) => (
            <button
              type="button"
              key={pi}
              className="pin"
              style={{ gridColumn: p.col, gridRow: p.row }}
              onClick={() => setSelected(p)}
              tabIndex={oculta ? -1 : undefined}
            >
              <PinMedia p={p} className="pin-media" />
              <div className="pin-body">
                <div className="pin-tags">
                  {p.video && <span className="pin-play" aria-hidden="true">▶</span>}
                  <span className="pin-tag">{p.tag}</span>
                  <PinLink url={p.demo} oculto={oculta} />
                </div>
                <h3 className="pin-title">{p.titulo}</h3>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section id="trabajos" className="works-section" ref={sectionRef}>
      <div className="works-shell">
        <div className="carousel-wrap">
          {/* Dos mitades idénticas: el keyframe -50% cierra el loop sin salto */}
          <div className="carousel-track" style={{ animationDuration: `${duracion}s` }}>
            {renderMitad(mitadRef, false)}
            {renderMitad(null, true)}
          </div>
        </div>
      </div>

      {/* Encabezado de sección (solo móvil), mismo estilo que "Servicios" */}
      <div className="services-head works-head">
        <span className="services-badge"><i className="services-dot" />PORTAFOLIO</span>
        <h2 className="services-heading">Proyectos</h2>
      </div>

      {/* Masonry vertical para móvil (Pinterest) */}
      <div className="works-mobile">
        {pinsPlanos.map((p, i) => (
          <button type="button" key={i} className="pin pin--m" onClick={() => setSelected(p)}>
            <PinMedia p={p} className="pin-media pin-media--m" />
            <div className="pin-body">
              <div className="pin-tags">
                {p.video && <span className="pin-play" aria-hidden="true">▶</span>}
                <span className="pin-tag">{p.tag}</span>
                <PinLink url={p.demo} />
              </div>
              <h3 className="pin-title">{p.titulo}</h3>
            </div>
            <span className="pin-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <ProjectModal pin={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
