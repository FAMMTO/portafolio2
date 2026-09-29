// Links que vienen de Supabase (proyectos.link, trayectoria.link, perfil.github): solo se aceptan
// http(s). Bloquea "javascript:", "data:" y similares, que ejecutarían código al hacer clic.
export const urlSegura = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
};
