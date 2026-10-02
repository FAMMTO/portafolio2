import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import ReactPlayer from 'react-player';
import CodeVisual from './CodeVisual.jsx';

// La descripción de Supabase viene como líneas "Etiqueta: texto" (Cliente, Objetivo, Alcance,
// Stack, Enfoque visual, Resultado). Se parte en secciones; si no sigue el formato → null.
const parseDescripcion = (texto) => {
  if (!texto) return null;
  const secciones = {};
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,30}):\s*(.+)$/);
    if (m) {
      const valor = m[2].trim();
      secciones[m[1].trim().toLowerCase()] = valor.charAt(0).toUpperCase() + valor.slice(1);
    }
  }
  return Object.keys(secciones).length >= 2 ? secciones : null;
};

// "a, b (x, y), c." → ["a", "b (x, y)", "c"]: separa por comas fuera de paréntesis.
const partirLista = (texto) => {
  const items = [];
  let actual = '', nivel = 0;
  for (const ch of texto.replace(/\.$/, '')) {
    if (ch === '(') nivel++;
    if (ch === ')') nivel--;
    if (ch === ',' && nivel === 0) { items.push(actual.trim()); actual = ''; } else actual += ch;
  }
  if (actual.trim()) items.push(actual.trim());
  return items.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
};

// Modal de proyecto: reproduce video (react-player) o muestra imagen + galería secundaria.
export default function ProjectModal({ pin, onClose }) {
  const [activa, setActiva] = useState(null); // imagen principal seleccionada
  const [videoRatio, setVideoRatio] = useState(null); // ancho/alto real del video
  const [imgRatios, setImgRatios] = useState({}); // src -> ancho/alto real de cada imagen
  const mediaRef = useRef(null);

  // Al abrir otro pin, resetea la imagen activa a su foto principal.
  useEffect(() => { setActiva(pin ? pin.foto : null); setVideoRatio(null); }, [pin]);

  // Lee las dimensiones reales del video para ajustar el modal a su proporción (sin barras negras).
  useEffect(() => {
    if (!pin || !pin.video) return;
    const host = mediaRef.current;
    if (!host) return;
    let vid = null;
    const attach = () => {
      vid = host.querySelector('video');
      if (!vid) return false;
      const read = () => {
        if (vid.videoWidth && vid.videoHeight) setVideoRatio(vid.videoWidth / vid.videoHeight);
      };
      if (vid.readyState >= 1) read();
      vid.addEventListener('loadedmetadata', read);
      return true;
    };
    // El <video> lo monta react-player un instante después; reintenta hasta encontrarlo.
    if (!attach()) {
      const id = setInterval(() => { if (attach()) clearInterval(id); }, 60);
      setTimeout(() => clearInterval(id), 3000);
      return () => clearInterval(id);
    }
    return () => { if (vid) vid.removeEventListener('loadedmetadata', () => {}); };
  }, [pin]);

  // Cerrar con Escape + bloquear scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!pin) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [pin, onClose]);

  // Galería: foto principal + secundarias. Sin galería definida → cuadritos vacíos guía.
  const secciones = parseDescripcion(pin?.descripcion);

  const galeria = pin && !pin.video
    ? [pin.foto, ...(pin.galeria || [])].filter(Boolean)
    : [];

  // Carrusel de arrastre: la foto sale hacia un lado poco a poco conforme el usuario
  // arrastra o hace scroll lateral, y se asienta en la siguiente/anterior al soltar.
  const mediaBoxRef = useRef(null);
  const x = useMotionValue(0);
  const [w, setW] = useState(0);
  const committing = useRef(false);
  const dragState = useRef({ startX: 0, startVal: 0, active: false });
  const wheelTimer = useRef(null);

  useEffect(() => {
    const el = mediaBoxRef.current;
    if (!el) return;
    const measure = () => setW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pin]);

  // Zoom: doble clic/doble tap, pellizco (2 dedos) o ctrl+scroll (trackpad). Independiente del swipe.
  const zoom = useMotionValue(1);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const combinedX = useTransform([x, panX], ([a, b]) => a + b);
  const pointers = useRef(new Map()); // pointerId -> {x,y}, para detectar pellizco de 2 dedos
  const pinchStart = useRef(null); // { dist, zoom }
  const panStart = useRef(null); // { x, y, panX, panY }
  const tapInfo = useRef(null); // { time, x, y } del pointerdown, para detectar doble tap en touch
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  // touch-action de la imagen: sin zoom deja hacer scroll vertical con el dedo (en móvil todo el modal
  // hace scroll); con zoom el dedo mueve la imagen ampliada. El swipe horizontal funciona en ambos casos.
  useEffect(() => {
    const aplicar = (z) => {
      if (mediaBoxRef.current) mediaBoxRef.current.style.touchAction = z > 1.01 ? 'none' : 'pan-y';
    };
    aplicar(zoom.get());
    return zoom.on('change', aplicar);
  }, [pin, zoom]);

  const resetZoom = () => { animate(zoom, 1, { duration: 0.25 }); animate(panX, 0, { duration: 0.25 }); animate(panY, 0, { duration: 0.25 }); };
  const toggleZoom = () => {
    if (zoom.get() > 1) resetZoom();
    else { animate(zoom, 2.2, { duration: 0.25 }); }
  };
  const clampPan = (val, max) => Math.max(-max, Math.min(max, val));

  // Al abrir otro pin o cambiar de foto (swipe o miniatura), la posición del arrastre y el zoom vuelven a cero.
  useEffect(() => {
    x.set(0); zoom.set(1); panX.set(0); panY.set(0);
    tapInfo.current = null;
    lastTap.current = { time: 0, x: 0, y: 0 };
  }, [pin, activa]);

  const idx = galeria.indexOf(activa);
  const prevSrc = galeria.length > 1 ? galeria[(idx - 1 + galeria.length) % galeria.length] : null;
  const nextSrc = galeria.length > 1 ? galeria[(idx + 1) % galeria.length] : null;
  const xPrev = useTransform(x, (v) => v - w);
  const xNext = useTransform(x, (v) => v + w);

  const commit = (dir) => {
    if (galeria.length < 2 || committing.current) return;
    committing.current = true;
    animate(x, dir === 1 ? -w : w, {
      duration: 0.32,
      ease: [0.2, 0.8, 0.2, 1],
      onComplete: () => {
        const siguiente = (idx + dir + galeria.length) % galeria.length;
        setActiva(galeria[siguiente]);
        x.set(0);
        committing.current = false;
      },
    });
  };
  const springBack = () => animate(x, 0, { type: 'spring', stiffness: 320, damping: 32 });
  const settle = () => {
    if (committing.current) return;
    const val = x.get();
    const threshold = w * 0.22;
    if (val <= -threshold) commit(1);
    else if (val >= threshold) commit(-1);
    else springBack();
  };

  // Swipe táctil con bloqueo de dirección: los primeros ~8px deciden. Horizontal → se cambia de foto
  // y se bloquea el scroll (preventDefault); vertical → se deja al navegador hacer scroll del modal.
  // Listeners nativos con passive:false (React no permite preventDefault en touchmove).
  const settleRef = useRef(settle);
  settleRef.current = settle;
  const puedeSwipeRef = useRef(false);
  puedeSwipeRef.current = galeria.length > 1;
  useEffect(() => {
    const el = mediaBoxRef.current;
    if (!el) return;
    let ini = null; // { x, y, val, dir: null | 'h' | 'v' }
    const onStart = (e) => {
      if (e.touches.length !== 1 || zoom.get() > 1.01 || !puedeSwipeRef.current || committing.current) { ini = null; return; }
      const t = e.touches[0];
      ini = { x: t.clientX, y: t.clientY, val: x.get(), dir: null };
    };
    const onMove = (e) => {
      if (!ini) return;
      if (e.touches.length !== 1) { ini = null; return; } // segundo dedo → pellizco, no swipe
      const t = e.touches[0];
      const dx = t.clientX - ini.x, dy = t.clientY - ini.y;
      if (!ini.dir) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        ini.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      if (ini.dir !== 'h') return;
      e.preventDefault();
      const ancho = el.offsetWidth;
      x.set(Math.max(-ancho, Math.min(ancho, ini.val + dx)));
    };
    const onEnd = () => {
      if (ini?.dir === 'h') settleRef.current();
      ini = null;
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [pin, x, zoom]);

  const onMediaPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      // Si el carrusel todavía está asentando el swipe anterior, este toque no cuenta como
      // tap (es un intento de swipe repetido) — si no, podría malinterpretarse como doble tap y forzar zoom.
      tapInfo.current = committing.current ? null : { time: Date.now(), x: e.clientX, y: e.clientY };
    }
    if (pointers.current.size === 2) {
      tapInfo.current = null; // el pellizco de 2 dedos no cuenta como toque simple
      dragState.current.active = false; // un segundo dedo cancela cualquier swipe en curso
      const [p1, p2] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(p2.x - p1.x, p2.y - p1.y), zoom: zoom.get() };
      return;
    }
    if (zoom.get() > 1) {
      panStart.current = { x: e.clientX, y: e.clientY, panX: panX.get(), panY: panY.get() };
      return;
    }
    if (galeria.length < 2 || committing.current) return;
    // El swipe con el dedo lo manejan los eventos táctiles de abajo (bloqueo de dirección);
    // aquí solo mouse/lápiz, porque en móvil el navegador cancela el puntero al detectar scroll.
    if (e.pointerType === 'touch') return;
    dragState.current = { startX: e.clientX, startVal: x.get(), active: true };
  };
  const onMediaPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [p1, p2] = [...pointers.current.values()];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      zoom.set(Math.max(1, Math.min(4, pinchStart.current.zoom * (dist / pinchStart.current.dist))));
      return;
    }
    if (panStart.current) {
      const maxPan = (zoom.get() - 1) * (w || 300) * 0.6;
      panX.set(clampPan(panStart.current.panX + (e.clientX - panStart.current.x), maxPan));
      panY.set(clampPan(panStart.current.panY + (e.clientY - panStart.current.y), maxPan));
      return;
    }
    if (dragState.current.active) {
      const raw = dragState.current.startVal + (e.clientX - dragState.current.startX);
      x.set(Math.max(-w, Math.min(w, raw)));
    }
  };
  const endDrag = (e) => {
    if (e) pointers.current.delete(e.pointerId);
    const wasPinching = !!pinchStart.current;
    if (pointers.current.size < 2 && pinchStart.current) {
      pinchStart.current = null;
      if (zoom.get() <= 1.05) resetZoom();
    }
    if (pointers.current.size === 0) {
      panStart.current = null;
      if (dragState.current.active) {
        dragState.current.active = false;
        settle();
      }
      // Doble tap/clic manual: el 'dblclick' nativo no es confiable en touch con touch-action:none + pointer capture.
      if (!wasPinching && e && tapInfo.current) {
        const dt = Date.now() - tapInfo.current.time;
        const dist = Math.hypot(e.clientX - tapInfo.current.x, e.clientY - tapInfo.current.y);
        if (dt < 250 && dist < 12) {
          const sinceLast = Date.now() - lastTap.current.time;
          const distFromLast = Math.hypot(e.clientX - lastTap.current.x, e.clientY - lastTap.current.y);
          if (sinceLast < 320 && distFromLast < 30) {
            toggleZoom();
            lastTap.current = { time: 0, x: 0, y: 0 };
          } else {
            lastTap.current = { time: Date.now(), x: e.clientX, y: e.clientY };
          }
        }
      }
      tapInfo.current = null;
    }
  };
  const onMediaWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const next = Math.max(1, Math.min(4, zoom.get() - e.deltaY * 0.01));
      if (next <= 1.02) resetZoom(); else zoom.set(next);
      return;
    }
    if (zoom.get() > 1 || galeria.length < 2 || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || committing.current) return;
    e.preventDefault();
    x.set(Math.max(-w, Math.min(w, x.get() - e.deltaX)));
    clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(settle, 120);
  };

  return (
    <AnimatePresence>
      {pin && (
        <motion.div
          className="pm-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`pm-dialog${pin.video ? '' : ' pm-dialog--split'}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <button className="pm-close" onClick={onClose} aria-label="Cerrar">×</button>

            {pin.video ? (
              <div
                className="pm-media pm-media--video"
                ref={mediaRef}
                style={videoRatio ? { aspectRatio: String(videoRatio) } : undefined}
              >
                <ReactPlayer src={pin.video} playing controls width="100%" height="100%"
                  style={{ width: '100%', height: '100%' }} />
              </div>
            ) : (
              <div className="pm-gallery">
                <div
                  className="pm-media"
                  ref={mediaBoxRef}
                  onPointerDown={onMediaPointerDown}
                  onPointerMove={onMediaPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onWheel={onMediaWheel}
                  // El marco toma la proporción real de la imagen activa: el modal se ajusta a ella.
                  style={{ touchAction: 'pan-y', '--r': (activa && imgRatios[activa]) || 16 / 9 }}
                >
                  {activa ? (
                    <>
                      {prevSrc && (
                        <motion.img className="pm-media-slide" src={prevSrc} alt="" style={{ x: xPrev, objectFit: pin.ajusteModal || pin.ajuste || 'cover' }} draggable={false} />
                      )}
                      <motion.img
                        className="pm-media-slide"
                        src={activa}
                        alt={pin.titulo}
                        style={{ x: combinedX, y: panY, scale: zoom, objectFit: pin.ajusteModal || pin.ajuste || 'cover' }}
                        draggable={false}
                        onLoad={(e) => {
                          const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
                          if (nw && nh) setImgRatios((r) => (r[activa] ? r : { ...r, [activa]: nw / nh }));
                        }}
                      />
                      {nextSrc && (
                        <motion.img className="pm-media-slide" src={nextSrc} alt="" style={{ x: xNext, objectFit: pin.ajusteModal || pin.ajuste || 'cover' }} draggable={false} />
                      )}
                    </>
                  ) : (
                    <div className="pm-placeholder" style={{ background: pin.fondo }}>
                      <CodeVisual visual={pin.visual} archivo={pin.archivo} codigo={pin.codigo} />
                    </div>
                  )}
                </div>
                {/* Cuadritos secundarios: solo si hay más de una imagen */}
                {galeria.length > 1 && (
                  <div className="pm-thumbs">
                    {galeria.map((src, i) => (
                      <button
                        key={src + i}
                        className={`pm-thumb${activa === src ? ' active' : ''}`}
                        onClick={() => setActiva(src)}
                        aria-label={`Imagen ${i + 1}`}
                      >
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pm-body">
              <span className="pm-tag">{pin.tag}</span>
              <h3 className="pm-title">{pin.titulo}</h3>
              {pin.cliente && <div className="pm-cliente">Cliente · {pin.cliente}</div>}
              {secciones?.cliente && <p className="pm-lead">{secciones.cliente}</p>}
              {/* Links arriba, junto al título: visibles sin hacer scroll en descripciones largas */}
              {(pin.repo || pin.demo) && (
                <div className="pm-links">
                  {pin.demo && <a href={pin.demo} target="_blank" rel="noopener noreferrer">Visitar sitio ↗</a>}
                  {pin.repo && <a href={pin.repo} target="_blank" rel="noopener noreferrer">Código ↗</a>}
                </div>
              )}
              {secciones ? (
                <div className="pm-sections">
                  {secciones.objetivo && (
                    <section className="pm-section">
                      <h4 className="pm-label">Objetivo</h4>
                      <p>{secciones.objetivo}</p>
                    </section>
                  )}
                  {secciones.alcance && (
                    <section className="pm-section">
                      <h4 className="pm-label">Alcance</h4>
                      <ul className="pm-list">
                        {partirLista(secciones.alcance).map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </section>
                  )}
                  {secciones['enfoque visual'] && (
                    <section className="pm-section">
                      <h4 className="pm-label">Enfoque visual</h4>
                      <p>{secciones['enfoque visual']}</p>
                    </section>
                  )}
                  {secciones.resultado && (
                    <section className="pm-section pm-section--resultado">
                      <h4 className="pm-label">Resultado</h4>
                      <p>{secciones.resultado}</p>
                    </section>
                  )}
                </div>
              ) : (
                pin.descripcion && <p className="pm-desc">{pin.descripcion}</p>
              )}
              {(pin.stack || secciones?.stack) && (
                <section className="pm-section">
                  <h4 className="pm-label">Stack</h4>
                  <div className="pm-stack">
                    {(pin.stack || secciones.stack.replace(/\.$/, '').split('·').map((s) => s.trim()))
                      .map((s) => <span key={s} className="pm-chip">{s}</span>)}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
