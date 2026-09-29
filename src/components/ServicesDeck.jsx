import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { servicios } from '../data.js';
import CodeVisual from './CodeVisual.jsx';

// Iconos de los servicios (trazo, heredan el color del contenedor).
function ServiceIcon({ tipo }) {
  const c = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (tipo === 'api') {
    return (
      <svg {...c}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>
    );
  }
  if (tipo === 'cloud') {
    return (
      <svg {...c}><path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z" /></svg>
    );
  }
  if (tipo === 'mcp') {
    // Enchufe: conectar modelos con sistemas
    return (
      <svg {...c}><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 0 1-12 0z" /><path d="M12 17v4" /></svg>
    );
  }
  if (tipo === 'agent') {
    // Chispa + nodos: agente que actúa
    return (
      <svg {...c}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 19h10" /></svg>
    );
  }
  // web
  return (
    <svg {...c}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
  );
}

// Deck estilo galería iPhone: tarjetas absolutas que se deslizan/escalan con spring (motion).
export default function ServicesDeck() {
  const [activeService, setActiveService] = useState(0);
  const [offsetX, setOffsetX] = useState(360);
  const n = servicios.length;

  // Offset entre tarjetas: más angosto en móvil para que las laterales se asomen sin desbordar.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const apply = () => setOffsetX(mq.matches ? 210 : 360);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Rota qué servicio ocupa el centro cada 4.8s (crossfade suave, sin slide horizontal).
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((a) => (a + 1) % n);
    }, 4800);
    return () => clearInterval(interval);
  }, [n]);

  // Swipe (touch/mouse) sobre el deck: izquierda → siguiente, derecha → anterior.
  const swipe = useRef({ x: 0, active: false });
  const onPointerDown = (e) => {
    if (e.target.closest('a')) return;
    swipe.current = { x: e.clientX, active: true };
  };
  const onPointerUp = (e) => {
    if (!swipe.current.active) return;
    swipe.current.active = false;
    const dx = e.clientX - swipe.current.x;
    if (Math.abs(dx) > 40) {
      setActiveService((a) => (dx < 0 ? (a + 1) % n : (a - 1 + n) % n));
    }
  };

  return (
    <>
    <div className="services-deck" aria-live="polite" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      {servicios.map((s, i) => {
        // Offset circular respecto a la tarjeta activa: -1 izquierda, 0 centro, +1 derecha.
        let off = i - activeService;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        const center = off === 0;
        return (
          <motion.div
            key={s.num}
            className={`svc-card svc-card--${s.tema}${center ? ' svc-card--center' : ' svc-card--side'}`}
            style={{ '--acento': s.acento }}
            onClick={() => !center && setActiveService(i)}
            initial={false}
            animate={{
              x: off * offsetX,
              scale: center ? 1 : 0.82,
              opacity: Math.abs(off) > 1 ? 0 : 1,
              zIndex: center ? 3 : 2 - Math.abs(off),
              filter: center ? 'brightness(1)' : 'brightness(.9)',
            }}
            transition={{ type: 'spring', stiffness: 210, damping: 26, mass: 0.9 }}
          >
            <div className="svc-top">
              <div className="svc-num">
                {s.num}
                <span className="svc-num-line" />
              </div>
              <span className="svc-icon"><ServiceIcon tipo={s.icono} /></span>
            </div>
            <h3 className="svc-title">
              {s.titulo1} <span style={{ color: s.acento }}>{s.titulo2}</span>
            </h3>
            <p className="svc-desc">{s.desc}</p>
            <a href="#contacto" className="svc-link">Ver más <span aria-hidden="true">↗</span></a>
            <div className="svc-media">
              <CodeVisual visual={s.visual} archivo={s.archivo} codigo={s.codigo} />
            </div>
          </motion.div>
        );
      })}
    </div>
    <div className="services-dots" role="tablist" aria-label="Servicios">
      {servicios.map((s, i) => (
        <button
          key={s.num}
          type="button"
          role="tab"
          aria-selected={i === activeService}
          aria-label={`${s.titulo1} ${s.titulo2}`}
          className={`services-dot-item${i === activeService ? ' active' : ''}`}
          onClick={() => setActiveService(i)}
        />
      ))}
    </div>
    </>
  );
}
