/**
 * Theme & Color Customization Service
 * Academic Atelier - Islamic Studies Management
 */

export interface ThemeOption {
  id: string;
  name: string;
  subtitle: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarCardBg: string;
  sidebarActiveBg: string;
  sidebarSubtext: string;
  previewBg: string;
  previewGradient: string;
  tag: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'indigo',
    name: 'النيلي الملكي',
    subtitle: 'النمط الافتراضي الفخم والموثوق',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    primaryBorder: '#c7d2fe',
    primaryText: '#3730a3',
    sidebarBg: '#0f1738',
    sidebarBorder: '#23336e',
    sidebarCardBg: '#15214d',
    sidebarActiveBg: '#253578',
    sidebarSubtext: '#a5b4fc',
    previewBg: '#4f46e5',
    previewGradient: 'from-indigo-600 to-indigo-800',
    tag: 'الافتراضي'
  },
  {
    id: 'emerald',
    name: 'الزمردي الإسلامي',
    subtitle: 'طابع الدراسات القرآنية والأصالة',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    primaryText: '#065f46',
    sidebarBg: '#063321',
    sidebarBorder: '#146b46',
    sidebarCardBg: '#0c452d',
    sidebarActiveBg: '#135c3c',
    sidebarSubtext: '#6ee7b7',
    previewBg: '#059669',
    previewGradient: 'from-emerald-600 to-teal-800',
    tag: 'إسلامي كلاسيكي'
  },
  {
    id: 'sky',
    name: 'الأزرق الأكاديمي',
    subtitle: 'هدوء وانتعاش بحري رسمي',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#f0f9ff',
    primaryBorder: '#bae6fd',
    primaryText: '#075985',
    sidebarBg: '#0a2e50',
    sidebarBorder: '#1662a8',
    sidebarCardBg: '#0e3e6b',
    sidebarActiveBg: '#145391',
    sidebarSubtext: '#7dd3fc',
    previewBg: '#0284c7',
    previewGradient: 'from-sky-600 to-blue-800',
    tag: 'أكاديمي'
  },
  {
    id: 'rose',
    name: 'العنابي الياقوتي',
    subtitle: 'فخامة ودفء لوني مميز',
    primary: '#be123c',
    primaryHover: '#9f1239',
    primaryLight: '#fff1f2',
    primaryBorder: '#fecdd3',
    primaryText: '#881337',
    sidebarBg: '#3b0d1e',
    sidebarBorder: '#7a1f42',
    sidebarCardBg: '#4f1329',
    sidebarActiveBg: '#661937',
    sidebarSubtext: '#fda4af',
    previewBg: '#be123c',
    previewGradient: 'from-rose-600 to-red-800',
    tag: 'ملكي فاخر'
  },
  {
    id: 'violet',
    name: 'البنفسجي الوقور',
    subtitle: 'هيبة إدارية وإشراق عصري',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryText: '#5b21b6',
    sidebarBg: '#2d1252',
    sidebarBorder: '#612ca8',
    sidebarCardBg: '#3d1a6e',
    sidebarActiveBg: '#4f238c',
    sidebarSubtext: '#c4b5fd',
    previewBg: '#7c3aed',
    previewGradient: 'from-violet-600 to-purple-800',
    tag: 'عصري'
  },
  {
    id: 'amber',
    name: 'الكهرماني الذهبي',
    subtitle: 'دفء تراثي وتألق مشرق',
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    primaryText: '#92400e',
    sidebarBg: '#382207',
    sidebarBorder: '#7a4b13',
    sidebarCardBg: '#4c2f0b',
    sidebarActiveBg: '#69400f',
    sidebarSubtext: '#fcd34d',
    previewBg: '#d97706',
    previewGradient: 'from-amber-600 to-amber-800',
    tag: 'ذهبي دافئ'
  },
  {
    id: 'teal',
    name: 'الفيروزي الحديث',
    subtitle: 'توازن بصري مريح للعين',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: '#f0fdfa',
    primaryBorder: '#99f6e4',
    primaryText: '#115e59',
    sidebarBg: '#083834',
    sidebarBorder: '#14756f',
    sidebarCardBg: '#0c4c47',
    sidebarActiveBg: '#135e5a',
    sidebarSubtext: '#5eead4',
    previewBg: '#0d9488',
    previewGradient: 'from-teal-600 to-emerald-800',
    tag: 'مريح للعين'
  },
  {
    id: 'slate',
    name: 'الرمادي الرخامي',
    subtitle: 'بساطة وأناقة رمادية متزنة',
    primary: '#475569',
    primaryHover: '#334155',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    primaryText: '#1e293b',
    sidebarBg: '#182236',
    sidebarBorder: '#354a73',
    sidebarCardBg: '#22304c',
    sidebarActiveBg: '#334155',
    sidebarSubtext: '#cbd5e1',
    previewBg: '#475569',
    previewGradient: 'from-slate-600 to-slate-800',
    tag: 'محايد فخم'
  }
];

// Helper to derive variants for a custom hex
export function generateCustomPalette(hex: string): Omit<ThemeOption, 'id' | 'name' | 'subtitle' | 'tag' | 'previewBg' | 'previewGradient'> {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  
  const num = parseInt(cleanHex, 16) || 0x4f46e5;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Darker shade for hover
  const hoverR = Math.max(0, Math.floor(r * 0.85));
  const hoverG = Math.max(0, Math.floor(g * 0.85));
  const hoverB = Math.max(0, Math.floor(b * 0.85));
  const primaryHover = `#${((hoverR << 16) | (hoverG << 8) | hoverB).toString(16).padStart(6, '0')}`;

  // Very light tint for container
  const lightR = Math.min(255, Math.floor(r * 0.1 + 255 * 0.9));
  const lightG = Math.min(255, Math.floor(g * 0.1 + 255 * 0.9));
  const lightB = Math.min(255, Math.floor(b * 0.1 + 255 * 0.9));
  const primaryLight = `#${((lightR << 16) | (lightG << 8) | lightB).toString(16).padStart(6, '0')}`;

  // Border tint
  const borderR = Math.min(255, Math.floor(r * 0.28 + 255 * 0.72));
  const borderG = Math.min(255, Math.floor(g * 0.28 + 255 * 0.72));
  const borderB = Math.min(255, Math.floor(b * 0.28 + 255 * 0.72));
  const primaryBorder = `#${((borderR << 16) | (borderG << 8) | borderB).toString(16).padStart(6, '0')}`;

  // Dark text variant
  const textR = Math.max(0, Math.floor(r * 0.65));
  const textG = Math.max(0, Math.floor(g * 0.65));
  const textB = Math.max(0, Math.floor(b * 0.65));
  const primaryText = `#${((textR << 16) | (textG << 8) | textB).toString(16).padStart(6, '0')}`;

  // Sidebar distinctly tinted background
  const sR = Math.max(12, Math.floor(r * 0.22));
  const sG = Math.max(14, Math.floor(g * 0.22));
  const sB = Math.max(22, Math.floor(b * 0.26));
  const sidebarBg = `#${((sR << 16) | (sG << 8) | sB).toString(16).padStart(6, '0')}`;

  // Sidebar border
  const sbR = Math.min(255, Math.floor(sR * 1.8 + 15));
  const sbG = Math.min(255, Math.floor(sG * 1.8 + 15));
  const sbB = Math.min(255, Math.floor(sB * 1.8 + 22));
  const sidebarBorder = `#${((sbR << 16) | (sbG << 8) | sbB).toString(16).padStart(6, '0')}`;

  // Sidebar card background
  const scR = Math.min(255, Math.floor(sR * 1.5 + 10));
  const scG = Math.min(255, Math.floor(sG * 1.5 + 10));
  const scB = Math.min(255, Math.floor(sB * 1.5 + 16));
  const sidebarCardBg = `#${((scR << 16) | (scG << 8) | scB).toString(16).padStart(6, '0')}`;

  // Sidebar active item background
  const saR = Math.min(255, Math.floor(sR * 2.2 + 20));
  const saG = Math.min(255, Math.floor(sG * 2.2 + 20));
  const saB = Math.min(255, Math.floor(sB * 2.2 + 28));
  const sidebarActiveBg = `#${((saR << 16) | (saG << 8) | saB).toString(16).padStart(6, '0')}`;

  // Sidebar subtext
  const stR = Math.min(255, Math.floor(r * 0.5 + 110));
  const stG = Math.min(255, Math.floor(g * 0.5 + 110));
  const stB = Math.min(255, Math.floor(b * 0.5 + 130));
  const sidebarSubtext = `#${((stR << 16) | (stG << 8) | stB).toString(16).padStart(6, '0')}`;

  return {
    primary: `#${cleanHex}`,
    primaryHover,
    primaryLight,
    primaryBorder,
    primaryText,
    sidebarBg,
    sidebarBorder,
    sidebarCardBg,
    sidebarActiveBg,
    sidebarSubtext
  };
}

export function applyTheme(themeId: string, customHex?: string, isDark: boolean = false) {
  if (typeof document === 'undefined') return;

  let activeTheme: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryBorder: string;
    primaryText: string;
    sidebarBg: string;
    sidebarBorder: string;
    sidebarCardBg: string;
    sidebarActiveBg: string;
    sidebarSubtext: string;
  };

  if (themeId === 'custom' && customHex) {
    activeTheme = generateCustomPalette(customHex);
  } else {
    const found = THEME_OPTIONS.find(t => t.id === themeId) || THEME_OPTIONS[0];
    activeTheme = {
      primary: found.primary,
      primaryHover: found.primaryHover,
      primaryLight: found.primaryLight,
      primaryBorder: found.primaryBorder,
      primaryText: found.primaryText,
      sidebarBg: found.sidebarBg,
      sidebarBorder: found.sidebarBorder,
      sidebarCardBg: found.sidebarCardBg,
      sidebarActiveBg: found.sidebarActiveBg,
      sidebarSubtext: found.sidebarSubtext
    };
  }

  // Set CSS variables on root
  const root = document.documentElement;
  root.style.setProperty('--color-primary', activeTheme.primary);
  root.style.setProperty('--color-primary-container', activeTheme.primaryLight);
  root.style.setProperty('--theme-primary', activeTheme.primary);
  root.style.setProperty('--theme-primary-hover', activeTheme.primaryHover);
  root.style.setProperty('--theme-primary-light', activeTheme.primaryLight);
  root.style.setProperty('--theme-primary-border', activeTheme.primaryBorder);
  root.style.setProperty('--theme-primary-text', activeTheme.primaryText);
  root.style.setProperty('--theme-sidebar-bg', activeTheme.sidebarBg);
  root.style.setProperty('--theme-sidebar-border', activeTheme.sidebarBorder);
  root.style.setProperty('--theme-sidebar-card', activeTheme.sidebarCardBg);
  root.style.setProperty('--theme-sidebar-active', activeTheme.sidebarActiveBg);
  root.style.setProperty('--theme-sidebar-subtext', activeTheme.sidebarSubtext);
  root.setAttribute('data-theme', themeId);

  // Configure Dark Mode attribute and class
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme-mode', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme-mode', 'light');
    root.style.colorScheme = 'light';
  }

  // Inject or update dynamic stylesheet
  let styleEl = document.getElementById('academic-atelier-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'academic-atelier-theme-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    /* Academic Atelier Dynamic Theme Overrides */
    :root {
      --color-primary: ${activeTheme.primary} !important;
      --color-primary-container: ${activeTheme.primaryLight} !important;
      --theme-sidebar-bg: ${activeTheme.sidebarBg} !important;
      --theme-sidebar-border: ${activeTheme.sidebarBorder} !important;
      --theme-sidebar-card: ${activeTheme.sidebarCardBg} !important;
      --theme-sidebar-active: ${activeTheme.sidebarActiveBg} !important;
      --theme-sidebar-subtext: ${activeTheme.sidebarSubtext} !important;
    }

    /* Right Sidebar Theme Overrides */
    aside,
    aside.bg-slate-900 {
      background-color: ${activeTheme.sidebarBg} !important;
      border-color: ${activeTheme.sidebarBorder} !important;
    }

    aside .border-slate-800 {
      border-color: ${activeTheme.sidebarBorder} !important;
    }

    aside .bg-slate-850 {
      background-color: ${activeTheme.sidebarCardBg} !important;
    }

    aside .bg-slate-800 {
      background-color: ${activeTheme.sidebarActiveBg} !important;
    }

    aside .hover\\:bg-slate-800\\/40:hover,
    aside .hover\\:bg-slate-800\\/30:hover {
      background-color: ${activeTheme.sidebarCardBg} !important;
    }

    /* Core Utility Overrides for seamless site-wide coloration */
    .bg-indigo-600,
    .bg-indigo-500 {
      background-color: ${activeTheme.primary} !important;
    }
    
    .hover\\:bg-indigo-700:hover,
    .hover\\:bg-indigo-650:hover,
    .hover\\:bg-indigo-600:hover {
      background-color: ${activeTheme.primaryHover} !important;
    }

    .text-indigo-600,
    .text-indigo-700,
    .text-indigo-500 {
      color: ${activeTheme.primary} !important;
    }

    .text-indigo-400 {
      color: ${activeTheme.sidebarSubtext} !important;
    }

    .border-indigo-500,
    .border-indigo-600 {
      border-color: ${activeTheme.primary} !important;
    }

    .border-indigo-100,
    .border-indigo-150,
    .border-indigo-200,
    .border-indigo-300 {
      border-color: ${activeTheme.primaryBorder} !important;
    }

    .bg-indigo-50,
    .bg-indigo-50\\/40,
    .bg-indigo-50\\/50,
    .bg-indigo-50\\/60,
    .bg-indigo-50\\/70 {
      background-color: ${activeTheme.primaryLight} !important;
    }

    .bg-indigo-600\\/10,
    .bg-indigo-500\\/10,
    .bg-indigo-500\\/15,
    .bg-indigo-500\\/20,
    .bg-indigo-500\\/25 {
      background-color: ${activeTheme.primary}1f !important;
    }

    .shadow-indigo-500\\/20,
    .shadow-indigo-600\\/10 {
      box-shadow: 0 10px 25px -5px ${activeTheme.primary}33 !important;
    }

    .focus\\:ring-indigo-500:focus,
    .focus\\:border-indigo-500:focus,
    .focus\\:border-indigo-600:focus {
      border-color: ${activeTheme.primary} !important;
      outline-color: ${activeTheme.primary} !important;
    }

    .accent-indigo-600 {
      accent-color: ${activeTheme.primary} !important;
    }

    /* ========================================================
     * Dynamic Dark Mode (الوضع الليلي) - Site-Wide Styles
     * ======================================================== */
    html.dark {
      color-scheme: dark !important;
    }

    html.dark body {
      background-color: #0b0f19 !important;
      color: #f1f5f9 !important;
    }

    html.dark .bg-background {
      background-color: #0b0f19 !important;
    }

    /* Cards & Containers */
    html.dark .bg-white {
      background-color: #111827 !important;
      color: #f1f5f9 !important;
      border-color: #1e293b !important;
    }

    html.dark .bg-white\\/95,
    html.dark .bg-white\\/90,
    html.dark .bg-white\\/80,
    html.dark .glass {
      background-color: rgba(17, 24, 39, 0.94) !important;
      border-color: #1e293b !important;
    }

    /* Secondary / Muted Backgrounds */
    html.dark .bg-slate-50,
    html.dark .bg-slate-50\\/80,
    html.dark .bg-slate-50\\/70,
    html.dark .bg-slate-50\\/60,
    html.dark .bg-slate-50\\/50,
    html.dark .bg-slate-50\\/40 {
      background-color: #0e1526 !important;
      border-color: #1e293b !important;
    }

    html.dark .bg-slate-100,
    html.dark .bg-slate-100\\/80,
    html.dark .bg-slate-100\\/60 {
      background-color: #162035 !important;
      border-color: #243048 !important;
    }

    html.dark .bg-slate-200,
    html.dark .bg-slate-200\\/70 {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
    }

    html.dark .hover\\:bg-slate-50:hover,
    html.dark .hover\\:bg-slate-50\\/50:hover,
    html.dark .hover\\:bg-slate-100:hover,
    html.dark .hover\\:bg-slate-200:hover {
      background-color: #1b263d !important;
    }

    /* Text Contrast in Dark Mode */
    html.dark .text-slate-900,
    html.dark .text-slate-850,
    html.dark .text-slate-800,
    html.dark .text-slate-750 {
      color: #f8fafc !important;
    }

    html.dark .text-slate-700,
    html.dark .text-slate-650,
    html.dark .text-slate-600 {
      color: #cbd5e1 !important;
    }

    html.dark .text-slate-500,
    html.dark .text-slate-450 {
      color: #94a3b8 !important;
    }

    html.dark .text-slate-400 {
      color: #7d8ea5 !important;
    }

    /* Borders */
    html.dark .border-slate-100,
    html.dark .border-slate-150,
    html.dark .border-slate-200,
    html.dark .border-slate-200\\/80,
    html.dark .border-slate-200\\/60,
    html.dark .border-slate-200\\/50,
    html.dark .border-slate-300 {
      border-color: #1e293b !important;
    }

    /* Form Inputs, Selects, and Textareas */
    html.dark input:not([type="color"]):not([type="checkbox"]):not([type="radio"]),
    html.dark textarea,
    html.dark select {
      background-color: #0e1629 !important;
      color: #f1f5f9 !important;
      border-color: #243048 !important;
    }

    html.dark select option {
      background-color: #0e1629 !important;
      color: #f1f5f9 !important;
    }

    html.dark input::placeholder,
    html.dark textarea::placeholder {
      color: #64748b !important;
    }

    /* TopBar Header in Dark Mode */
    html.dark header {
      background-color: rgba(14, 21, 38, 0.96) !important;
      border-bottom-color: #1e293b !important;
    }

    /* Tables in Dark Mode */
    html.dark table thead th {
      background-color: #141d33 !important;
      color: #e2e8f0 !important;
      border-color: #1e293b !important;
    }

    html.dark table tbody td {
      border-color: #1e293b !important;
    }

    html.dark table tbody tr:hover td {
      background-color: #16223a !important;
    }

    /* Tinted badges in dark mode with active theme color */
    html.dark .bg-indigo-50,
    html.dark .bg-indigo-50\\/40,
    html.dark .bg-indigo-50\\/50,
    html.dark .bg-indigo-50\\/60,
    html.dark .bg-indigo-50\\/70 {
      background-color: ${activeTheme.primary}25 !important;
      color: ${activeTheme.sidebarSubtext} !important;
      border-color: ${activeTheme.primary}45 !important;
    }

    html.dark .text-indigo-600,
    html.dark .text-indigo-700 {
      color: ${activeTheme.sidebarSubtext} !important;
    }

    /* Soft semantic badges in dark mode */
    html.dark .bg-emerald-50 {
      background-color: rgba(5, 150, 105, 0.18) !important;
      border-color: rgba(5, 150, 105, 0.35) !important;
    }
    html.dark .bg-rose-50 {
      background-color: rgba(225, 29, 72, 0.18) !important;
      border-color: rgba(225, 29, 72, 0.35) !important;
    }
    html.dark .bg-amber-50 {
      background-color: rgba(217, 119, 6, 0.18) !important;
      border-color: rgba(217, 119, 6, 0.35) !important;
    }
    html.dark .bg-sky-50 {
      background-color: rgba(2, 132, 199, 0.18) !important;
      border-color: rgba(2, 132, 199, 0.35) !important;
    }

    /* Ambient blur reduction */
    html.dark .bg-blue-100\\/30 {
      opacity: 0.08 !important;
    }

    /* Dialogs / Modals */
    html.dark .shadow-xl,
    html.dark .shadow-2xl {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
    }

    /* Strict Print Media Protection: Never print dark mode */
    @media print {
      html.dark,
      html.dark body {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      html.dark * {
        background-color: transparent !important;
        color: #0f172a !important;
        box-shadow: none !important;
      }
      html.dark table th,
      html.dark table td {
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
      }
    }
  `;
}
