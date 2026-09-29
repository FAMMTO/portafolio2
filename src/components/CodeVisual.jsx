// Visual generado con código (sustituye a las fotos): ventana de editor, terminal o mockup de interfaz.
const KEYWORDS = /\b(export|async|function|const|let|await|return|if|for|in|def|import|from|model|new)\b/g;

// Resaltado mínimo: strings, comentarios y palabras clave.
function highlight(line) {
  const parts = [];
  const re = /("[^"]*"|'[^']*'|\/\/.*$|#.*$)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push({ t: line.slice(last, m.index) });
    parts.push({ t: m[0], c: m[0].startsWith('/') || m[0].startsWith('#') ? 'cv-com' : 'cv-str' });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ t: line.slice(last) });
  return parts.flatMap((p, i) => {
    if (p.c) return [<span key={i} className={p.c}>{p.t}</span>];
    return p.t.split(KEYWORDS).map((s, j) =>
      j % 2 ? <span key={`${i}-${j}`} className="cv-kw">{s}</span> : s
    );
  });
}

function TerminalLine({ line }) {
  if (line.startsWith('$') || line.startsWith('>')) return <><span className="cv-prompt">{line[0]}</span>{line.slice(1)}</>;
  if (line.startsWith('✔')) return <span className="cv-ok">{line}</span>;
  return <span className="cv-dim">{line}</span>;
}

function UiMock() {
  return (
    <div className="cv-ui">
      <div className="cv-ui-side">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i === 1 ? 'on' : ''} />)}
      </div>
      <div className="cv-ui-main">
        <div className="cv-ui-row">
          <span className="cv-ui-kpi" /><span className="cv-ui-kpi" /><span className="cv-ui-kpi" />
        </div>
        <div className="cv-ui-chart">
          {[40, 62, 48, 75, 58, 88, 70, 95].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
        </div>
        <div className="cv-ui-lines"><span /><span /><span /></div>
      </div>
    </div>
  );
}

export default function CodeVisual({ visual = 'code', archivo, codigo = [], fondo, compacto = false }) {
  return (
    <div className={`cv cv--${visual}${compacto ? ' cv--compact' : ''}`} style={fondo ? { background: fondo } : undefined}>
      <div className="cv-bar">
        <i /><i /><i />
        {archivo && <span className="cv-file">{archivo}</span>}
      </div>
      {visual === 'ui' ? (
        <UiMock />
      ) : (
        <pre className="cv-body">
          {codigo.map((line, i) => (
            <div key={i} className="cv-line">
              {visual === 'code' && <span className="cv-ln">{i + 1}</span>}
              {visual === 'terminal' ? <TerminalLine line={line} /> : highlight(line)}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}
