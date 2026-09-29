import { useEffect, useState } from 'react';
import { perfil, stack } from '../data.js';
import { alTerminarIntro } from '../lib/carga.js';

// Fondo del hero: editor que "teclea" un objeto con el perfil. Arranca al terminar la intro
// (cuando el telón de carga se retira, no con un tiempo fijo).
const SOURCE = [
  'const developer = {',
  `  nombre: "${perfil.nombre}",`,
  `  rol: "${perfil.rol}",`,
  `  ubicacion: "${perfil.ciudad}",`,
  `  stack: [${stack.slice(0, 5).map((s) => `"${s}"`).join(', ')}],`,
  '  disponible: true,',
  '};',
  '',
  'developer.construir("tu próximo proyecto");',
].join('\n');

export default function HeroCode() {
  const [started, setStarted] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => alTerminarIntro(() => setStarted(true)), []);

  useEffect(() => {
    if (!started || n >= SOURCE.length) return;
    const t = setTimeout(() => setN((v) => v + 1), SOURCE[n] === '\n' ? 120 : 22);
    return () => clearTimeout(t);
  }, [started, n]);

  return (
    <div className={`hero-video hero-code${started ? ' visible' : ''}`}>
      <div className="hero-code-win" aria-hidden="true">
        <div className="cv-bar"><i /><i /><i /><span className="cv-file">developer.ts</span></div>
        <pre className="hero-code-body">
          {SOURCE.slice(0, n)}
          <span className="hero-caret" />
        </pre>
      </div>
      <div className="hero-video-overlay" />
    </div>
  );
}
