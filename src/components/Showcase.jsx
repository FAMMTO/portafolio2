import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, LayoutGroup } from 'motion/react';
import { casos } from '../data.js';
import CodeVisual from './CodeVisual.jsx';

// Featured-case block: "launch" parallax on scroll + animated case switching.
export default function Showcase() {
  const [destacado, setDestacado] = useState(0);
  const sectionRef = useRef(null);
  const c = casos[destacado];

  // Launch parallax: rises 180px, scales 0.88 → 1, fades in — driven by scroll position.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 0.35'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [180, 0], { ease: (t) => 1 - Math.pow(1 - t, 3) });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1], { ease: (t) => 1 - Math.pow(1 - t, 3) });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1], { ease: (t) => 1 - Math.pow(1 - t, 3) });

  // Evita que swipes/clics rápidos disparen varios cambios antes de que la transición (0.7s)
  // termine: si no, las animaciones de layout compartido (layoutId) se pisan y la imagen se pierde.
  const isAnimating = useRef(false);
  const cambiarA = (index) => {
    if (isAnimating.current || index === destacado) return;
    isAnimating.current = true;
    setDestacado(index);
    setTimeout(() => { isAnimating.current = false; }, 700);
  };
  const prev = () => cambiarA((destacado - 1 + casos.length) % casos.length);
  const next = () => cambiarA((destacado + 1) % casos.length);

  // Swipe / arrastre: izquierda → siguiente, derecha → anterior. Funciona con touch y mouse.
  const swipe = useRef({ x: 0, y: 0, active: false });
  const onPointerDown = (e) => {
    // Ignora arrastres que empiezan sobre botones/enlaces (tabs, flechas, previews).
    if (e.target.closest('button, a')) return;
    swipe.current = { x: e.clientX, y: e.clientY, active: true };
  };
  const onPointerUp = (e) => {
    if (!swipe.current.active) return;
    swipe.current.active = false;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    }
  };

  // Siguiente caso: preview esquina inferior derecha. Anterior: esquina superior izquierda.
  const siguiente = casos[(destacado + 1) % casos.length];
  const anterior = casos[(destacado - 1 + casos.length) % casos.length];

  const fade = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.4, ease: 'easeOut' },
  };

  return (
    <section className="showcase-section" ref={sectionRef}>
      <LayoutGroup>
      <motion.div
        className="showcase"
        style={{ y, scale, opacity, background: c.bg, touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Preview del servicio anterior: comparte layout con la imagen central (regreso) */}
        <button className="show-prev-preview" onClick={prev} aria-label={`Anterior: ${anterior.label}`}>
          <motion.span
            key={anterior.label}
            layoutId={`caso-${anterior.label}`}
            className="show-next-thumb"
            style={anterior.foto ? undefined : { background: anterior.img }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {anterior.foto && (
              <img src={anterior.foto} alt={anterior.label}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
          </motion.span>
        </button>

        <div className="show-tabs">
          {casos.map((caso, j) => (
            <button
              key={caso.label}
              className={`show-tab${j === destacado ? ' active' : ''}`}
              onClick={() => cambiarA(j)}
            >
              {caso.label}
            </button>
          ))}
        </div>

        <div className="show-left">
          <div className="show-arrows">
            <button className="show-arrow" onClick={prev} aria-label="Anterior">‹</button>
            <button className="show-arrow" onClick={next} aria-label="Siguiente">›</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={destacado} {...fade}>
              <h2 className="show-title">{c.titulo}</h2>
              <p className="show-desc">{c.desc}</p>
            </motion.div>
          </AnimatePresence>
          <a href="#contacto" className="show-cta">Ver proyecto →</a>
        </div>

        <div className="show-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={c.label}
              layoutId={`caso-${c.label}`}
              className="show-img"
              style={{
                background: c.img,
                ...(c.ancho ? { maxWidth: c.ancho, width: c.ancho } : {}),
                ...(c.alto ? { height: c.alto } : {}),
              }}
              // El visual se desliza y crece desde el thumb de la esquina (layout compartido).
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <CodeVisual visual={c.visual} archivo={c.archivo} codigo={c.codigo} />
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={destacado}
              className="show-lema"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              {c.lema}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="show-right">
          <div>
            <div className="show-year">{c.ano}</div>
            <div className="show-sector">{c.sector}</div>
          </div>
          <div className="show-deliverables">
            <span className="show-deliverables-label">FUNCIONALIDADES</span>
            {c.entregables.map((e) => (
              <span key={e} className="show-pill">{e}</span>
            ))}
          </div>
        </div>

        {/* Preview del siguiente servicio: comparte layout con la imagen central */}
        <button className="show-next-preview" onClick={next} aria-label={`Siguiente: ${siguiente.label}`}>
          <motion.span
            key={siguiente.label}
            layoutId={`caso-${siguiente.label}`}
            className="show-next-thumb"
            style={siguiente.foto ? undefined : { background: siguiente.img }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {siguiente.foto && (
              <img src={siguiente.foto} alt={siguiente.label}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
          </motion.span>
        </button>
      </motion.div>
      </LayoutGroup>
    </section>
  );
}
