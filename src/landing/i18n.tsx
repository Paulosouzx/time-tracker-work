import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';

export type Lang = 'pt' | 'en' | 'es';
const STORAGE_KEY = 'tt_lang';

const pt = {
  htmlLang: 'pt-PT',
  langName: 'Português',
  skip: 'Saltar para o conteúdo',
  brandHome: 'Time Tracker, início da página',
  nav: { features: 'Funcionalidades', how: 'Como funciona', notes: 'Notas', faq: 'FAQ', sections: 'Secções', footer: 'Rodapé' },
  login: 'Entrar',
  start: 'Começar',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  language: 'Idioma',
  hero: {
    line1: 'Regista, organiza e acompanha',
    line2: 'o teu tempo num só lugar',
    sub: 'Horas por projeto, calendário com feriados, dashboard semanal e notas sempre à mão. Grátis, no browser ou instalado no telemóvel.',
    google: 'Começar com Google',
    googleLoading: 'A abrir o Google…',
    how: 'Ver como funciona',
    error: 'Não foi possível iniciar o login com Google. Tenta novamente.',
  },
  features: {
    eyebrow: 'Funcionalidades',
    title: 'Tudo o que precisas para o teu dia de trabalho',
    register: ['Registo de tempo', 'Horas por projeto, com descrição, data e link da case. Marca o que já passaste para o sistema e acompanha o progresso do dia.'],
    holidays: ['Calendário com feriados', 'Feriados oficiais carregados automaticamente por país e região, visíveis na semana e no calendário.'],
    dashboard: ['Dashboard semanal', 'Escolhe a semana no gráfico e vê total, média por dia e horas por projeto.'],
    editor: ['Notas com rich text', 'Títulos, listas, citações e formatação. Reordena, marca como feitas e colapsa.'],
    sync: ['Sincronização em tempo real', 'As notas atualizam-se ao mesmo tempo em todos os teus dispositivos e separadores.'],
    pwa: ['Instalável como app', 'Adiciona ao ecrã principal e abre como uma app, no telemóvel ou no computador.'],
  },
  notes: {
    eyebrow: 'Notas flutuantes',
    title: 'As tuas notas, por cima de qualquer ecrã',
    text: 'Estás no dashboard e lembras-te de algo? Abre o painel, aponta e continua. Tudo fica sincronizado com a página de Notas.',
    points: [
      'Botão de notas em todos os separadores, sem sair do que estás a fazer.',
      'Adiciona uma nota com Enter e marca-a como concluída ali mesmo.',
      'O mesmo editor rich text da página de Notas, com gravação automática.',
      'Arrasta o painel para o lado que preferires ou minimiza-o numa barra.',
      'Atalho Alt + Shift + N para abrir e Esc para minimizar.',
    ],
  },
  how: {
    eyebrow: 'Como funciona',
    title: 'Três passos e já estás a registar',
    steps: [
      ['Entra com Google', 'Um clique e a tua conta fica criada. Também podes usar email e palavra-passe.'],
      ['Regista o teu tempo', 'Escolhe as horas, o projeto e a data. Edita ou marca como registado quando quiseres.'],
      ['Acompanha no dashboard', 'Vê cada semana em detalhe, compara com as anteriores e descobre onde vai o teu tempo.'],
    ],
  },
  theme: {
    eyebrow: 'Claro e escuro',
    title: 'Bonito de dia, confortável à noite',
    text: 'Escolhe o tema ou deixa seguir o sistema. Experimenta aqui: muda o tema desta página.',
    group: 'Tema da página',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
  },
  install: {
    eyebrow: 'Instala no telemóvel',
    title: 'Uma app no ecrã principal, sem loja',
    text: 'O Time Tracker é uma PWA: instala-se a partir do browser, abre em ecrã inteiro e atualiza-se sozinho.',
    button: 'Instalar',
    installed: 'Já estás a usar a app instalada.',
    hint: 'No iPhone: botão Partilhar → “Adicionar ao ecrã principal”. No Chrome: menu → “Instalar app”.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Perguntas frequentes',
    items: [
      ['É grátis?', 'Sim, é gratuito. Só precisas de uma conta Google ou de email.'],
      ['Onde ficam os meus dados?', 'Numa base de dados Supabase alojada na União Europeia (Frankfurt). Cada conta só consegue ler e escrever os seus próprios registos.'],
      ['Funciona offline?', 'A app abre sem ligação, porque fica guardada no dispositivo. Para guardar e sincronizar registos e notas precisas de internet.'],
      ['Posso partilhar com alguém?', 'Ainda não. Cada conta é individual. O que sincroniza em tempo real são as tuas notas, entre os teus dispositivos.'],
      ['Que formas de login existem?', 'Google ou email e palavra-passe.'],
    ],
  },
  cta: {
    title: 'Começa hoje a registar o teu tempo',
    text: 'Grátis, sem instalar nada. Entra com a tua conta Google e regista a primeira entrada em segundos.',
    button: 'Começar agora',
  },
  notFound: {
    title: 'Página não encontrada',
    text: 'O endereço que procuras não existe ou mudou de sítio. Volta ao início e continua a registar o teu tempo.',
    home: 'Voltar ao início',
    note: 'Esta página foi registada como 0h',
  },
  mock: {
    postit: 'Aponta tudo sem sair do que estás a fazer',
    today: 'Hoje',
    thisWeek: 'Esta semana',
    week: 'Semana 41',
    month: 'Outubro',
    weekdays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    dayInitials: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    entries: [['Revisão de layout', 'Website'], ['Reunião semanal', 'Cliente'], ['Deploy produção', 'Interno']],
    events: ['Reunião cliente', 'Revisão de layout'],
    holiday: 'Implantação da República',
    noteTitle: 'Ideias sprint',
    noteItems: ['Rever o dashboard', 'Testar a app instalada'],
    saved: 'Guardado',
    notes: 'Notas',
    addNote: 'Adicionar nota…',
    panelItems: [['Ideias sprint', 'Rever o dashboard · Testar a app'], ['Lista escritório', 'Café, papel'], ['Reunião cliente', 'Prazos e orçamento']],
    dashboard: 'Dashboard',
    totalHours: 'Total de horas',
  },
};

export type Dict = typeof pt;

const en: Dict = {
  htmlLang: 'en',
  langName: 'English',
  skip: 'Skip to content',
  brandHome: 'Time Tracker, top of page',
  nav: { features: 'Features', how: 'How it works', notes: 'Notes', faq: 'FAQ', sections: 'Sections', footer: 'Footer' },
  login: 'Log in',
  start: 'Get started',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  language: 'Language',
  hero: {
    line1: 'Log, organise and track',
    line2: 'your time in one place',
    sub: 'Hours per project, a calendar with public holidays, a weekly dashboard and notes always at hand. Free, in the browser or installed on your phone.',
    google: 'Continue with Google',
    googleLoading: 'Opening Google…',
    how: 'See how it works',
    error: 'Could not start Google sign-in. Please try again.',
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything you need for your working day',
    register: ['Time logging', 'Hours per project with description, date and case link. Mark what you have already logged elsewhere and follow your daily progress.'],
    holidays: ['Calendar with holidays', 'Official public holidays loaded automatically by country and region, shown in your week and calendar.'],
    dashboard: ['Weekly dashboard', 'Pick a week on the chart and see the total, daily average and hours per project.'],
    editor: ['Rich text notes', 'Headings, lists, quotes and formatting. Reorder, mark as done and collapse.'],
    sync: ['Real-time sync', 'Your notes update at the same time on all your devices and tabs.'],
    pwa: ['Installable app', 'Add it to your home screen and open it like an app, on your phone or computer.'],
  },
  notes: {
    eyebrow: 'Floating notes',
    title: 'Your notes, on top of any screen',
    text: 'On the dashboard and something comes to mind? Open the panel, jot it down and carry on. Everything stays in sync with the Notes page.',
    points: [
      'A notes button on every tab, without leaving what you are doing.',
      'Add a note with Enter and mark it as done right there.',
      'The same rich text editor as the Notes page, with autosave.',
      'Drag the panel to either side or minimise it into a bar.',
      'Shortcut Alt + Shift + N to open and Esc to minimise.',
    ],
  },
  how: {
    eyebrow: 'How it works',
    title: 'Three steps and you are logging',
    steps: [
      ['Sign in with Google', 'One click and your account is ready. You can also use email and password.'],
      ['Log your time', 'Pick the hours, project and date. Edit or mark as logged whenever you like.'],
      ['Track it on the dashboard', 'See each week in detail, compare with previous ones and find out where your time goes.'],
    ],
  },
  theme: {
    eyebrow: 'Light and dark',
    title: 'Beautiful by day, comfortable at night',
    text: 'Choose a theme or follow your system. Try it here: switch this page’s theme.',
    group: 'Page theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  install: {
    eyebrow: 'Install on your phone',
    title: 'An app on your home screen, no store needed',
    text: 'Time Tracker is a PWA: install it from the browser, it opens full screen and updates itself.',
    button: 'Install',
    installed: 'You are already using the installed app.',
    hint: 'On iPhone: Share button → “Add to Home Screen”. On Chrome: menu → “Install app”.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      ['Is it free?', 'Yes, it is free. You only need a Google account or an email.'],
      ['Where is my data stored?', 'In a Supabase database hosted in the European Union (Frankfurt). Each account can only read and write its own records.'],
      ['Does it work offline?', 'The app opens without a connection because it is stored on your device. Saving and syncing entries and notes needs internet.'],
      ['Can I share it with someone?', 'Not yet. Each account is individual. What syncs in real time are your notes, across your own devices.'],
      ['How can I sign in?', 'With Google or with email and password.'],
    ],
  },
  cta: {
    title: 'Start tracking your time today',
    text: 'Free, nothing to install. Sign in with Google and log your first entry in seconds.',
    button: 'Get started now',
  },
  notFound: {
    title: 'Page not found',
    text: 'The address you are looking for does not exist or has moved. Head back home and keep tracking your time.',
    home: 'Back to home',
    note: 'This page was logged as 0h',
  },
  mock: {
    postit: 'Jot everything down without leaving what you are doing',
    today: 'Today',
    thisWeek: 'This week',
    week: 'Week 41',
    month: 'October',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dayInitials: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    entries: [['Layout review', 'Website'], ['Weekly meeting', 'Client'], ['Production deploy', 'Internal']],
    events: ['Client meeting', 'Layout review'],
    holiday: 'Republic Day',
    noteTitle: 'Sprint ideas',
    noteItems: ['Review the dashboard', 'Test the installed app'],
    saved: 'Saved',
    notes: 'Notes',
    addNote: 'Add a note…',
    panelItems: [['Sprint ideas', 'Review the dashboard · Test the app'], ['Office list', 'Coffee, paper'], ['Client meeting', 'Deadlines and budget']],
    dashboard: 'Dashboard',
    totalHours: 'Total hours',
  },
};

const es: Dict = {
  htmlLang: 'es',
  langName: 'Español',
  skip: 'Saltar al contenido',
  brandHome: 'Time Tracker, inicio de la página',
  nav: { features: 'Funciones', how: 'Cómo funciona', notes: 'Notas', faq: 'FAQ', sections: 'Secciones', footer: 'Pie de página' },
  login: 'Entrar',
  start: 'Empezar',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  language: 'Idioma',
  hero: {
    line1: 'Registra, organiza y controla',
    line2: 'tu tiempo en un solo lugar',
    sub: 'Horas por proyecto, calendario con festivos, panel semanal y notas siempre a mano. Gratis, en el navegador o instalado en el móvil.',
    google: 'Empezar con Google',
    googleLoading: 'Abriendo Google…',
    how: 'Ver cómo funciona',
    error: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  },
  features: {
    eyebrow: 'Funciones',
    title: 'Todo lo que necesitas para tu jornada',
    register: ['Registro de tiempo', 'Horas por proyecto, con descripción, fecha y enlace del caso. Marca lo que ya pasaste al sistema y sigue el progreso del día.'],
    holidays: ['Calendario con festivos', 'Festivos oficiales cargados automáticamente por país y región, visibles en la semana y en el calendario.'],
    dashboard: ['Panel semanal', 'Elige la semana en el gráfico y consulta el total, la media diaria y las horas por proyecto.'],
    editor: ['Notas con texto enriquecido', 'Títulos, listas, citas y formato. Reordena, marca como hechas y contrae.'],
    sync: ['Sincronización en tiempo real', 'Las notas se actualizan a la vez en todos tus dispositivos y pestañas.'],
    pwa: ['Instalable como app', 'Añádela a la pantalla de inicio y ábrela como una app, en el móvil o en el ordenador.'],
  },
  notes: {
    eyebrow: 'Notas flotantes',
    title: 'Tus notas, encima de cualquier pantalla',
    text: '¿Estás en el panel y te acuerdas de algo? Abre las notas, apúntalo y sigue. Todo queda sincronizado con la página de Notas.',
    points: [
      'Botón de notas en todas las pestañas, sin salir de lo que estás haciendo.',
      'Añade una nota con Enter y márcala como hecha ahí mismo.',
      'El mismo editor de texto enriquecido de la página de Notas, con guardado automático.',
      'Arrastra el panel al lado que prefieras o minimízalo en una barra.',
      'Atajo Alt + Shift + N para abrir y Esc para minimizar.',
    ],
  },
  how: {
    eyebrow: 'Cómo funciona',
    title: 'Tres pasos y ya estás registrando',
    steps: [
      ['Entra con Google', 'Un clic y tu cuenta está lista. También puedes usar email y contraseña.'],
      ['Registra tu tiempo', 'Elige las horas, el proyecto y la fecha. Edita o marca como registrado cuando quieras.'],
      ['Contrólalo en el panel', 'Mira cada semana en detalle, compárala con las anteriores y descubre a dónde va tu tiempo.'],
    ],
  },
  theme: {
    eyebrow: 'Claro y oscuro',
    title: 'Bonito de día, cómodo de noche',
    text: 'Elige el tema o deja que siga al sistema. Pruébalo aquí: cambia el tema de esta página.',
    group: 'Tema de la página',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
  },
  install: {
    eyebrow: 'Instálala en el móvil',
    title: 'Una app en la pantalla de inicio, sin tienda',
    text: 'Time Tracker es una PWA: se instala desde el navegador, se abre a pantalla completa y se actualiza sola.',
    button: 'Instalar',
    installed: 'Ya estás usando la app instalada.',
    hint: 'En iPhone: botón Compartir → “Añadir a pantalla de inicio”. En Chrome: menú → “Instalar app”.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Preguntas frecuentes',
    items: [
      ['¿Es gratis?', 'Sí, es gratuito. Solo necesitas una cuenta de Google o un email.'],
      ['¿Dónde se guardan mis datos?', 'En una base de datos Supabase alojada en la Unión Europea (Fráncfort). Cada cuenta solo puede leer y escribir sus propios registros.'],
      ['¿Funciona sin conexión?', 'La app se abre sin conexión porque queda guardada en el dispositivo. Para guardar y sincronizar registros y notas necesitas internet.'],
      ['¿Puedo compartirla con alguien?', 'Todavía no. Cada cuenta es individual. Lo que se sincroniza en tiempo real son tus notas, entre tus dispositivos.'],
      ['¿Cómo puedo iniciar sesión?', 'Con Google o con email y contraseña.'],
    ],
  },
  cta: {
    title: 'Empieza hoy a registrar tu tiempo',
    text: 'Gratis, sin instalar nada. Entra con tu cuenta de Google y registra tu primera entrada en segundos.',
    button: 'Empezar ahora',
  },
  notFound: {
    title: 'Página no encontrada',
    text: 'La dirección que buscas no existe o ha cambiado. Vuelve al inicio y sigue registrando tu tiempo.',
    home: 'Volver al inicio',
    note: 'Esta página se registró como 0h',
  },
  mock: {
    postit: 'Apúntalo todo sin salir de lo que estás haciendo',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    week: 'Semana 41',
    month: 'Octubre',
    weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    dayInitials: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    entries: [['Revisión de diseño', 'Website'], ['Reunión semanal', 'Cliente'], ['Despliegue producción', 'Interno']],
    events: ['Reunión cliente', 'Revisión de diseño'],
    holiday: 'Fiesta Nacional',
    noteTitle: 'Ideas sprint',
    noteItems: ['Revisar el panel', 'Probar la app instalada'],
    saved: 'Guardado',
    notes: 'Notas',
    addNote: 'Añadir nota…',
    panelItems: [['Ideas sprint', 'Revisar el panel · Probar la app'], ['Lista oficina', 'Café, papel'], ['Reunión cliente', 'Plazos y presupuesto']],
    dashboard: 'Panel',
    totalHours: 'Total de horas',
  },
};

export const DICTS: Record<Lang, Dict> = { pt, en, es };
export const LANGS: Lang[] = ['pt', 'en', 'es'];

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
  } catch {
    return 'pt';
  }
  const browser = (navigator.language || 'pt').toLowerCase();
  if (browser.startsWith('en')) return 'en';
  if (browser.startsWith('es')) return 'es';
  return 'pt';
}

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (lang: Lang) => void }>({ lang: 'pt', t: pt, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = DICTS[lang].htmlLang;
  }, [lang]);

  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function Flag({ lang, size = 20 }: { lang: Lang; size?: number }) {
  const clipId = useId();
  const common = { width: size, height: Math.round(size * 0.7), viewBox: '0 0 30 21', 'aria-hidden': true, focusable: false, className: 'lp-flag' } as const;
  if (lang === 'pt') {
    return (
      <svg {...common}>
        <rect width="30" height="21" fill="#DA291C" />
        <rect width="12" height="21" fill="#046A38" />
        <circle cx="12" cy="10.5" r="4.2" fill="#FFE900" />
        <circle cx="12" cy="10.5" r="2.6" fill="#DA291C" />
        <rect x="10.8" y="8.6" width="2.4" height="3.2" rx="0.6" fill="#fff" />
      </svg>
    );
  }
  if (lang === 'es') {
    return (
      <svg {...common}>
        <rect width="30" height="21" fill="#AA151B" />
        <rect y="5.25" width="30" height="10.5" fill="#F1BF00" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <clipPath id={clipId}><rect width="30" height="21" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="30" height="21" fill="#012169" />
        <path d="M0 0L30 21M30 0L0 21" stroke="#fff" strokeWidth="4.2" />
        <path d="M0 0L30 21M30 0L0 21" stroke="#C8102E" strokeWidth="1.4" />
        <path d="M15 0V21M0 10.5H30" stroke="#fff" strokeWidth="7" />
        <path d="M15 0V21M0 10.5H30" stroke="#C8102E" strokeWidth="4.2" />
      </g>
    </svg>
  );
}
