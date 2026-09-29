import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { obtenerDatos } from '../lib/carga.js';
import { urlSegura } from '../lib/url.js';

// Modal "Carrera": historial profesional desde la tabla `trayectoria`.
// Se abre con el evento global 'abrir-carrera' (botón "Carrera" del nav, que es HTML estático).
// Si el clic ocurre antes de hidratar, el nav deja window.__abrirCarrera = true y se abre al montar.

const MODALIDAD = { PRESENCIAL: 'Presencial', REMOTO: 'Remoto', HIBRIDO: 'Híbrido' };
const MAX_FUNCIONES = 8;

// "2023-05-01" → Date local (evita el corrimiento de zona horaria de new Date('2023-05-01')).
const aFecha = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const mesAno = (d) => d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }).replace('.', '');

// Duración legible: "1 año 7 meses", "10 meses", "1 mes".
const duracion = (ini, fin) => {
  const meses = Math.max(1, (fin.getFullYear() - ini.getFullYear()) * 12 + (fin.getMonth() - ini.getMonth()) + 1);
  const a = Math.floor(meses / 12), m = meses % 12;
  const partes = [];
  if (a) partes.push(`${a} ${a === 1 ? 'año' : 'años'}`);
  if (m) partes.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  return partes.join(' ');
};

function Puesto({ t }) {
  const [abierto, setAbierto] = useState(false);
  const [todasFunciones, setTodasFunciones] = useState(false);
  const link = urlSegura(t.link);
  const ini = aFecha(t.fecha_inicio);
  const fin = t.fecha_fin ? aFecha(t.fecha_fin) : new Date();
  const parrafos = (t.descripcion || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const funciones = todasFunciones ? t.funciones : t.funciones.slice(0, MAX_FUNCIONES);
  const restantes = t.funciones.length - MAX_FUNCIONES;

  return (
    <li className={`cr-item${t.fecha_fin ? '' : ' cr-item--actual'}`}>
      <span className="cr-dot" aria-hidden="true" />
      <div className="cr-head">
        <div>
          <h3 className="cr-puesto">{t.puesto}</h3>
          <div className="cr-empresa">
            {link
              ? <a href={link} target="_blank" rel="noopener noreferrer">{t.empresa} ↗</a>
              : t.empresa}
          </div>
        </div>
        {!t.fecha_fin && <span className="cr-badge">Actual</span>}
      </div>
      <div className="cr-meta">
        <span>{mesAno(ini)} — {t.fecha_fin ? mesAno(fin) : 'presente'} · {duracion(ini, fin)}</span>
        {(t.ubicacion || t.modalidad) && (
          <span>{[t.ubicacion, MODALIDAD[t.modalidad]].filter(Boolean).join(' · ')}</span>
        )}
      </div>

      {parrafos.length > 0 && (
        <div className="cr-desc">
          {(abierto ? parrafos : parrafos.slice(0, 1)).map((p, i) => <p key={i}>{p}</p>)}
          {parrafos.length > 1 && (
            <button type="button" className="cr-more" onClick={() => setAbierto((v) => !v)}>
              {abierto ? 'Ver menos' : `Ver más (${parrafos.length - 1})`}
            </button>
          )}
        </div>
      )}

      {t.funciones.length > 0 && (
        <div className="cr-block">
          <h4 className="cr-label">Funciones</h4>
          <ul className="cr-funciones">
            {funciones.map((f) => <li key={f}>{f}</li>)}
          </ul>
          {restantes > 0 && (
            <button type="button" className="cr-more" onClick={() => setTodasFunciones((v) => !v)}>
              {todasFunciones ? 'Ver menos' : `+${restantes} más`}
            </button>
          )}
        </div>
      )}

      {t.stack.length > 0 && (
        <div className="cr-block">
          <h4 className="cr-label">Stack</h4>
          <div className="cr-stack">
            {t.stack.map((s) => <span key={s} className="pm-chip">{s}</span>)}
          </div>
        </div>
      )}
    </li>
  );
}

export default function CareerModal() {
  const [abierto, setAbierto] = useState(false);
  const [puestos, setPuestos] = useState(null); // null = cargando
  const [error, setError] = useState(false);

  // Escucha el botón del nav; si ya lo pulsaron antes de hidratar, abre de inmediato.
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener('abrir-carrera', abrir);
    if (window.__abrirCarrera) { window.__abrirCarrera = false; abrir(); }
    return () => window.removeEventListener('abrir-carrera', abrir);
  }, []);

  // Trayectoria de la carga central (ya descargada durante el telón). Más reciente primero.
  useEffect(() => {
    if (!abierto || puestos) return;
    obtenerDatos().then(({ trayectoria }) => {
      if (!trayectoria) { setError(true); return; }
      setPuestos(trayectoria);
    });
  }, [abierto, puestos]);

  // Escape para cerrar + bloquea el scroll de fondo.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [abierto]);

  const cerrar = () => setAbierto(false);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="pm-overlay"
          onClick={cerrar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="cr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cr-titulo"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <button className="pm-close" onClick={cerrar} aria-label="Cerrar">×</button>
            <header className="cr-header">
              <span className="pm-tag">TRAYECTORIA</span>
              <h2 id="cr-titulo" className="cr-title">Mi carrera</h2>
            </header>
            <div className="cr-scroll">
              {error && <p className="cr-empty">No se pudo cargar la trayectoria. Intenta de nuevo más tarde.</p>}
              {!error && !puestos && <p className="cr-empty">Cargando…</p>}
              {puestos && puestos.length === 0 && <p className="cr-empty">Aún no hay puestos publicados.</p>}
              {puestos && puestos.length > 0 && (
                <ol className="cr-timeline">
                  {puestos.map((t) => <Puesto key={t.id} t={t} />)}
                </ol>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
