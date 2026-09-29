// Datos personales: edita aquí nombre, rol y redes. Correo, teléfono y GitHub viven en la tabla `perfil`
// de Supabase (el github de aquí es solo el valor inicial mientras carga).
export const perfil = {
  nombre: 'César Toro',
  iniciales: 'CT',
  rol: 'Desarrollador Fullstack',
  ciudad: 'Monterrey, MX',
  github: 'https://github.com/FAMMTO',
  linkedin: 'https://www.linkedin.com/',
};

// Proyectos destacados del showcase. visual: 'code' | 'terminal' | 'ui'. codigo: líneas que se muestran en el visual.
// ancho/alto: tamaño del recuadro del visual, en píxeles.
export const casos = [
  {
    label: 'SAAS', ancho: 620, alto: 380, bg: '#1E2A3A', img: 'linear-gradient(160deg, #2C3E55, #172231)',
    titulo: 'Plataforma SaaS de facturación', desc: 'Aplicación multi-tenant con suscripciones, roles y panel de métricas en tiempo real. Next.js en el frontend, API en Node con PostgreSQL y colas para procesos pesados.',
    lema: 'De la idea al MRR en 10 semanas', ano: '2026', sector: 'NEXT.JS · NODE · POSTGRES', entregables: ['Auth + roles', 'Stripe', 'Dashboard'],
    visual: 'code', archivo: 'billing.service.ts',
    codigo: [
      'export async function createInvoice(tenantId: string, items: Item[]) {',
      '  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);',
      '  const invoice = await db.invoice.create({',
      '    data: { tenantId, total, status: "pending" },',
      '  });',
      '  await queue.add("send-invoice", { id: invoice.id });',
      '  return invoice;',
      '}',
    ],
  },
  {
    label: 'E-COMMERCE', ancho: 620, alto: 380, bg: '#2B2440', img: 'linear-gradient(160deg, #3D3360, #1F1A30)',
    titulo: 'Tienda en línea headless', desc: 'E-commerce con catálogo, carrito persistente y checkout optimizado. Frontend en Astro + React, CMS headless y pagos integrados. Lighthouse 98 en móvil.',
    lema: 'Carga rápida, más ventas', ano: '2025', sector: 'ASTRO · REACT · STRIPE', entregables: ['Catálogo', 'Checkout', 'SEO técnico'],
    visual: 'ui', archivo: 'tienda.dev',
  },
  {
    label: 'API', ancho: 620, alto: 380, bg: '#1F3A30', img: 'linear-gradient(160deg, #2B5244, #152A22)',
    titulo: 'API REST y GraphQL escalable', desc: 'Backend para una app logística: autenticación JWT, rate limiting, caché con Redis y documentación OpenAPI. Desplegado en contenedores con CI/CD.',
    lema: '99.9% de disponibilidad', ano: '2025', sector: 'NESTJS · REDIS · DOCKER', entregables: ['REST + GraphQL', 'Tests', 'OpenAPI'],
    visual: 'terminal', archivo: 'zsh',
    codigo: [
      '$ docker compose up -d',
      '✔ Container api-redis     Started',
      '✔ Container api-postgres  Started',
      '✔ Container api-server    Started',
      '$ curl -s localhost:3000/health',
      '{"status":"ok","uptime":"12d 4h","latency":"18ms"}',
      '$ pnpm test',
      '✔ 184 tests passed (6.2s)',
    ],
  },
  {
    label: 'AUTOMATIZACIÓN', ancho: 620, alto: 380, bg: '#3A2A1E', img: 'linear-gradient(160deg, #55402C, #2A1E15)',
    titulo: 'Automatización de procesos internos', desc: 'Scripts y servicios que conectan hojas de cálculo, ERP y correo para eliminar trabajo manual. Python, webhooks y tareas programadas con reportes automáticos.',
    lema: 'Horas de trabajo manual → minutos', ano: '2026', sector: 'PYTHON · WEBHOOKS · CRON', entregables: ['Integraciones', 'Reportes', 'Alertas'],
    visual: 'code', archivo: 'sync_pedidos.py',
    codigo: [
      'def sincronizar_pedidos():',
      '    pedidos = erp.get("/pedidos", params={"estado": "nuevo"})',
      '    for p in pedidos:',
      '        hoja.append_row([p["id"], p["cliente"], p["total"]])',
      '        notificar(p["vendedor"], f"Pedido {p[\'id\']} listo")',
      '    # corre cada 15 minutos',
      '    return len(pedidos)',
    ],
  },
];

// Mosaico de proyectos. tag: categoría para filtros. visual/codigo: igual que en casos.
// stack: tecnologías. repo/demo: enlaces opcionales que aparecen en el modal.
export const carouselBlocks = [
  {
    cols: 'repeat(4, 1fr)', rows: 'repeat(5, 1fr)',
    pins: [
      { col: '1 / 2', row: '1 / 4', visual: 'code', archivo: 'useAuth.ts', fondo: '#1E2A3A', tag: 'FRONTEND', titulo: 'Hook de autenticación', stack: ['React', 'TypeScript', 'JWT'], descripcion: 'Manejo de sesión con refresh tokens silenciosos, rutas protegidas y sincronización entre pestañas.', codigo: ['export function useAuth() {', '  const [user, setUser] = useState(null);', '  useEffect(() => {', '    const unsub = session.on(setUser);', '    return unsub;', '  }, []);', '  return { user, login, logout };', '}'] },
      { col: '2 / 3', row: '1 / 4', visual: 'ui', archivo: 'admin.app', fondo: '#2B2440', tag: 'FULLSTACK', titulo: 'Panel administrativo', stack: ['Next.js', 'Prisma', 'PostgreSQL'], descripcion: 'Dashboard con tablas paginadas en servidor, filtros, exportación a Excel y permisos por rol.' },
      { col: '3 / 4', row: '1 / 3', visual: 'terminal', archivo: 'deploy', fondo: '#1F3A30', tag: 'DEVOPS', titulo: 'Pipeline CI/CD', stack: ['GitHub Actions', 'Docker', 'AWS'], descripcion: 'Build, tests y despliegue automático a producción en cada merge, con rollback en un clic.', codigo: ['$ git push origin main', '→ build ........ ok', '→ test ......... ok', '→ deploy ....... ok', '✔ live en 2m 14s'] },
      { col: '4 / 5', row: '1 / 4', visual: 'code', archivo: 'schema.prisma', fondo: '#2A2A2E', tag: 'BACKEND', titulo: 'Modelado de datos', stack: ['Prisma', 'PostgreSQL'], descripcion: 'Esquema relacional normalizado con migraciones versionadas y seeds para entornos de prueba.', codigo: ['model Order {', '  id        String   @id', '  total     Decimal', '  status    Status', '  customer  User     @relation', '  createdAt DateTime @default(now())', '}'] },
      { col: '1 / 3', row: '4 / 6', visual: 'ui', archivo: 'landing.dev', fondo: '#3A2A1E', tag: 'FRONTEND', titulo: 'Landing de alto rendimiento', stack: ['Astro', 'CSS', 'Motion'], descripcion: 'Sitio estático con animaciones fluidas, imágenes optimizadas y 100 en accesibilidad.' },
      { col: '3 / 4', row: '3 / 6', visual: 'code', archivo: 'routes.ts', fondo: '#1E2A3A', tag: 'BACKEND', titulo: 'API de pedidos', stack: ['Node', 'Express', 'Zod'], descripcion: 'Endpoints validados con Zod, manejo centralizado de errores y logs estructurados.', codigo: ['router.post("/orders",', '  validate(OrderSchema),', '  async (req, res) => {', '    const order = await svc.create(req.body);', '    res.status(201).json(order);', '  });'] },
      { col: '4 / 5', row: '4 / 6', visual: 'terminal', archivo: 'bot', fondo: '#2B2440', tag: 'FULLSTACK', titulo: 'Bot de WhatsApp', stack: ['Node', 'Webhooks', 'IA'], descripcion: 'Asistente que responde pedidos y consulta inventario en tiempo real.', codigo: ['> ¿Tienen stock del SKU-204?', '✔ Sí, 38 piezas disponibles', '> Aparta 5', '✔ Pedido #8812 creado'] },
    ],
  },
  {
    cols: 'repeat(3, 1fr)', rows: 'repeat(3, 1fr)',
    pins: [
      { col: '1 / 2', row: '1 / 4', visual: 'ui', archivo: 'app.móvil', fondo: '#1F3A30', tag: 'FRONTEND', titulo: 'App móvil de reservas', stack: ['React Native', 'Expo', 'Supabase'], descripcion: 'Reservas con calendario, notificaciones push y pagos dentro de la app.' },
      { col: '2 / 3', row: '1 / 2', visual: 'code', archivo: 'cache.ts', fondo: '#2A2A2E', tag: 'BACKEND', titulo: 'Capa de caché', stack: ['Redis', 'Node'], descripcion: 'Caché con invalidación por eventos que redujo la latencia promedio de 420ms a 35ms.', codigo: ['const hit = await redis.get(key);', 'if (hit) return JSON.parse(hit);', 'const data = await fetchFresh();', 'await redis.set(key, data, "EX", 60);'] },
      { col: '3 / 4', row: '1 / 2', visual: 'terminal', archivo: 'k8s', fondo: '#1E2A3A', tag: 'DEVOPS', titulo: 'Infra como código', stack: ['Terraform', 'Kubernetes'], descripcion: 'Entornos reproducibles de staging y producción definidos en Terraform.', codigo: ['$ terraform apply', 'Plan: 12 to add, 0 to destroy', '✔ Apply complete!'] },
      { col: '2 / 3', row: '2 / 3', visual: 'code', archivo: 'realtime.ts', fondo: '#3A2A1E', tag: 'FULLSTACK', titulo: 'Chat en tiempo real', stack: ['WebSockets', 'React', 'Node'], descripcion: 'Mensajería con presencia de usuarios, indicador de escritura y historial paginado.', codigo: ['io.on("connection", (s) => {', '  s.on("msg", (m) => io.emit("msg", m));', '});'] },
      { col: '3 / 4', row: '2 / 3', visual: 'ui', archivo: 'metrics.app', fondo: '#2B2440', tag: 'FRONTEND', titulo: 'Dashboard de métricas', stack: ['React', 'D3', 'TanStack Query'], descripcion: 'Visualización de KPIs con gráficas interactivas y actualización en vivo.' },
      { col: '2 / 4', row: '3 / 4', visual: 'code', archivo: 'scraper.py', fondo: '#1F3A30', tag: 'BACKEND', titulo: 'Scraper y ETL de precios', stack: ['Python', 'Playwright', 'PostgreSQL'], descripcion: 'Recolección diaria de precios de competidores, limpieza y carga a base de datos para análisis.', codigo: ['async def extraer(url):', '    page = await browser.new_page()', '    await page.goto(url)', '    return await page.locator(".price").all_inner_texts()'] },
    ],
  },
];

// Categorías de filtros (móvil).
export const categorias = ['TODOS', 'FRONTEND', 'BACKEND', 'FULLSTACK', 'DEVOPS'];

// tema: 'dark' | 'light'. acento: color de la 2ª palabra, número e icono. icono: 'web'|'api'|'cloud'|'mcp'|'agent'.
export const servicios = [
  { num: '01', tema: 'dark',  acento: '#9CC5A3', icono: 'web',   titulo1: 'Desarrollo', titulo2: 'Frontend', desc: 'Interfaces rápidas, accesibles y responsivas con React, Next.js y Astro. Animaciones cuidadas y rendimiento medible.', visual: 'ui', archivo: 'frontend.app' },
  { num: '02', tema: 'light', acento: '#7A5AF0', icono: 'api',   titulo1: 'Backend &', titulo2: 'APIs', desc: 'APIs REST y GraphQL, bases de datos relacionales, autenticación, pagos e integraciones con servicios externos.', visual: 'code', archivo: 'server.ts', codigo: ['app.get("/api/users/:id", auth, async (req, res) => {', '  const user = await db.user.find(req.params.id);', '  res.json(user);', '});'] },
  { num: '03', tema: 'dark',  acento: '#4A9EE8', icono: 'cloud', titulo1: 'DevOps &', titulo2: 'Cloud', desc: 'Docker, CI/CD y despliegues en AWS, Vercel o VPS. Monitoreo, logs y entornos reproducibles.', visual: 'terminal', archivo: 'deploy', codigo: ['$ docker build -t app .', '$ gh workflow run deploy', '✔ deploy a producción ok'] },
  { num: '04', tema: 'light', acento: '#E8804A', icono: 'mcp',   titulo1: 'Servidores', titulo2: 'MCP', desc: 'Conecto tu ERP, CRM o base de datos a Claude y otros modelos con Model Context Protocol. OAuth, permisos por rol y bitácora de cada llamada.', visual: 'code', archivo: 'mcp-server.ts', codigo: ['server.tool("buscar_pedido",', '  { folio: z.string() },', '  async ({ folio }) => {', '    const p = await erp.pedidos.get(folio);', '    return { content: [{ type: "text", text: JSON.stringify(p) }] };', '  });'] },
  { num: '05', tema: 'dark',  acento: '#C58CF0', icono: 'agent', titulo1: 'Agentificación de', titulo2: 'procesos', desc: 'Agentes de IA que leen correos y documentos, deciden con tus reglas y ejecutan en tus sistemas, con aprobación humana en pasos críticos.', visual: 'terminal', archivo: 'agente', codigo: ['> Nueva factura de proveedor recibida', '→ extraer datos ......... ok', '→ validar contra OC-1182 . ok', '→ registrar en ERP ...... ok', '✔ lista para aprobación'] },
];

// Stack técnico para la sección "Sobre mí".
export const stack = ['TypeScript', 'React', 'Next.js', 'Astro', 'Node.js', 'NestJS', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'Git'];
