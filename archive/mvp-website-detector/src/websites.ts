import type { WebsiteTarget, UserAgentConfig } from './types.js';

/**
 * Lista de sitios web populares para probar accesibilidad con Playwright
 */
export const POPULAR_WEBSITES: WebsiteTarget[] = [
  // E-commerce
  {
    name: 'Amazon',
    url: 'https://www.amazon.com',
    description: 'Plataforma de comercio electrónico más grande del mundo',
    category: 'ecommerce',
    expectedSelectors: ['#nav-logo', '[data-cy="search-bar"]', '.nav-fill'],
    blockedIndicators: [
      'text=Sorry! Something went wrong',
      'text=Robot Check',
      'text=Enter the characters you see below',
      '[data-cy="captcha"]'
    ],
    riskLevel: 'high'
  },
  {
    name: 'AliExpress',
    url: 'https://www.aliexpress.com',
    description: 'Marketplace global de productos desde China',
    category: 'ecommerce',
    expectedSelectors: ['.search-bar', '.logo', '.header-content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Security check',
      'text=Verification Required',
      '.captcha-container'
    ],
    riskLevel: 'medium'
  },
  {
    name: 'eBay',
    url: 'https://www.ebay.com',
    description: 'Plataforma de subastas y ventas online',
    category: 'ecommerce',
    expectedSelectors: ['#gh-ac', '.gh-logo', '#mainContent'],
    blockedIndicators: [
      'text=Security Measure',
      'text=Please verify you are human',
      '.blocked-page'
    ],
    riskLevel: 'medium'
  },

  // Social Media
  {
    name: 'Twitter/X',
    url: 'https://x.com',
    description: 'Red social de microblogging',
    category: 'social',
    expectedSelectors: ['[data-testid="loginButton"]', 'nav[role="navigation"]', 'main'],
    blockedIndicators: [
      'text=Something went wrong',
      'text=Rate limit exceeded',
      'text=Unusual activity detected'
    ],
    riskLevel: 'high'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com',
    description: 'Plataforma de compartición de fotos y videos',
    category: 'social',
    expectedSelectors: ['[data-testid="royal_login_form"]', 'article', 'header'],
    blockedIndicators: [
      'text=Challenge Required',
      'text=Suspicious Activity',
      'text=Try Again Later'
    ],
    riskLevel: 'high'
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com',
    description: 'La red social más grande del mundo',
    category: 'social',
    expectedSelectors: ['#email', '#pass', '[data-testid="open-registration-form-button"]'],
    blockedIndicators: [
      'text=Blocked',
      'text=Security Check Required',
      'text=Account Temporarily Locked'
    ],
    riskLevel: 'high'
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    description: 'Red social profesional',
    category: 'social',
    expectedSelectors: ['.nav__button-secondary', 'main', '.global-nav'],
    blockedIndicators: [
      'text=Challenge',
      'text=Unusual activity',
      'text=Security verification'
    ],
    riskLevel: 'high'
  },

  // Search Engines
  {
    name: 'Google',
    url: 'https://www.google.com',
    description: 'Motor de búsqueda más popular del mundo',
    category: 'search',
    expectedSelectors: ['[name="q"]', '.gLFyf', 'input[title="Buscar"]'],
    blockedIndicators: [
      'text=Our systems have detected unusual traffic',
      'text=captcha',
      '#recaptcha'
    ],
    riskLevel: 'medium'
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com',
    description: 'Motor de búsqueda de Microsoft',
    category: 'search',
    expectedSelectors: ['#sb_form_q', '.hp_sw', 'main'],
    blockedIndicators: [
      'text=Access Denied',
      'text=Suspicious activity',
      '.blocked-page'
    ],
    riskLevel: 'low'
  },
  {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    description: 'Motor de búsqueda que respeta la privacidad',
    category: 'search',
    expectedSelectors: ['#searchbox_input', '.homepage-wrap', 'main'],
    blockedIndicators: [
      'text=Blocked',
      'text=Rate limited'
    ],
    riskLevel: 'low'
  },

  // Entertainment
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    description: 'Plataforma de videos más grande del mundo',
    category: 'entertainment',
    expectedSelectors: ['#logo', '#search', 'ytd-app'],
    blockedIndicators: [
      'text=This page isn\'t working',
      'text=Something went wrong',
      'text=Sign in to confirm your age'
    ],
    riskLevel: 'medium'
  },
  {
    name: 'Netflix',
    url: 'https://www.netflix.com',
    description: 'Servicio de streaming de video',
    category: 'entertainment',
    expectedSelectors: ['.our-story-header', 'main', '.hero-title'],
    blockedIndicators: [
      'text=Pardon the interruption',
      'text=Unusual activity',
      '.error-page'
    ],
    riskLevel: 'medium'
  },
  {
    name: 'Twitch',
    url: 'https://www.twitch.tv',
    description: 'Plataforma de streaming para gamers',
    category: 'entertainment',
    expectedSelectors: ['[data-a-target="browse-link"]', 'nav', 'main'],
    blockedIndicators: [
      'text=Access Denied',
      'text=Unusual Activity',
      '.error-overlay'
    ],
    riskLevel: 'low'
  },

  // News
  {
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    description: 'Sitio de noticias de la BBC',
    category: 'news',
    expectedSelectors: ['[data-testid="header"]', 'main', '.gs-o-header'],
    blockedIndicators: [
      'text=Access denied',
      'text=Geo-blocked',
      '.error-page'
    ],
    riskLevel: 'low'
  },
  {
    name: 'CNN',
    url: 'https://www.cnn.com',
    description: 'Sitio de noticias CNN',
    category: 'news',
    expectedSelectors: ['.header', 'main', '#header'],
    blockedIndicators: [
      'text=Access Denied',
      'text=Blocked',
      '.error-message'
    ],
    riskLevel: 'low'
  },

  // Tech
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Plataforma de desarrollo colaborativo',
    category: 'tech',
    expectedSelectors: ['.HeaderMenu', 'main', '.application-main'],
    blockedIndicators: [
      'text=Rate limit exceeded',
      'text=Access denied',
      '.flash-error'
    ],
    riskLevel: 'low'
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    description: 'Comunidad de programadores Q&A',
    category: 'tech',
    expectedSelectors: ['.top-bar', 'main', '#content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited',
      '.error-page'
    ],
    riskLevel: 'low'
  }
];

/**
 * Configuraciones de User-Agent para diferentes estrategias
 */
export const USER_AGENTS: UserAgentConfig[] = [
  {
    name: 'Chrome Desktop',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    description: 'User-Agent estándar de Chrome en Windows'
  },
  {
    name: 'Firefox Desktop',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    description: 'User-Agent estándar de Firefox en Windows'
  },
  {
    name: 'Safari Desktop',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    description: 'User-Agent estándar de Safari en macOS'
  },
  {
    name: 'Chrome Mobile',
    value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    description: 'User-Agent de Chrome en Android'
  },
  {
    name: 'iPhone Safari',
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    description: 'User-Agent de Safari en iPhone'
  },
  {
    name: 'Bot-friendly',
    value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    description: 'User-Agent que simula ser Googlebot'
  }
];

/**
 * Configuración por defecto para testing
 */
export const DEFAULT_TEST_CONFIG = {
  timeout: 15000,
  headless: false, // Para debugging
  retries: 2,
  screenshotOnBlock: true,
  waitForNetworkIdle: true
};

// NUEVOS SITIOS CON ALTA PROBABILIDAD DE SER EXCELENTES - AGREGADOS A LA LISTA EXISTENTE

// Wikimedia Projects (sin protecciones anti-bot)
export const EXCELLENT_WEBSITES: WebsiteTarget[] = [
  {
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org',
    description: 'Enciclopedia libre online',
    category: 'academic',
    expectedSelectors: ['#searchInput', '#mw-content-text', '.mw-page-title-main'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org',
    description: 'Repositorio de medios libres',
    category: 'academic',
    expectedSelectors: ['.mw-search-input', '#mw-content-text', '.main-page-content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Wikidata',
    url: 'https://www.wikidata.org',
    description: 'Base de conocimiento libre',
    category: 'academic',
    expectedSelectors: ['.wikibase-entityview', '#searchInput', '.mw-content-ltr'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Wikisource',
    url: 'https://wikisource.org',
    description: 'Biblioteca libre de textos fuente',
    category: 'academic',
    expectedSelectors: ['#searchInput', '.mainpage-left', '#mw-content-text'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Documentación Técnica y APIs
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'Documentación de desarrollo web',
    category: 'tech',
    expectedSelectors: ['.header-search', 'main', '.article-container'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited',
      'text=Cloudflare'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'NASA Technical Reports',
    url: 'https://ntrs.nasa.gov',
    description: 'Servidor de reportes técnicos de la NASA',
    category: 'academic',
    expectedSelectors: ['.search-input', '.content', 'main'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'ArXiv',
    url: 'https://arxiv.org',
    description: 'Archivo abierto de trabajos de investigación',
    category: 'academic',
    expectedSelectors: ['#query', '.content', 'main'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'DOAJ',
    url: 'https://doaj.org',
    description: 'Directorio de revistas de acceso abierto',
    category: 'academic',
    expectedSelectors: ['.search-input', 'main', '.content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Bibliotecas y Archivos Públicos
  {
    name: 'Internet Archive',
    url: 'https://archive.org',
    description: 'Biblioteca digital y archivo',
    category: 'academic',
    expectedSelectors: ['.search-input', '.welcome-left', 'main'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited',
      'text=Cloudflare'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Library of Congress',
    url: 'https://www.loc.gov',
    description: 'Biblioteca nacional de EE.UU.',
    category: 'academic',
    expectedSelectors: ['#search-input', 'main', '.homepage'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Project Gutenberg',
    url: 'https://www.gutenberg.org',
    description: 'Biblioteca de libros electrónicos gratuitos',
    category: 'academic',
    expectedSelectors: ['.content', 'main', '.header'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Sitios Gubernamentales (.gov)
  {
    name: 'USA.gov',
    url: 'https://www.usa.gov',
    description: 'Portal del gobierno de EE.UU.',
    category: 'government',
    expectedSelectors: ['.usa-search', 'main', '.usa-header'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Data.gov',
    url: 'https://www.data.gov',
    description: 'Datos abiertos del gobierno de EE.UU.',
    category: 'government',
    expectedSelectors: ['.search-input', 'main', '.navbar'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Organizaciones Open Source
  {
    name: 'Apache Foundation',
    url: 'https://www.apache.org',
    description: 'Fundación de Software Apache',
    category: 'tech',
    expectedSelectors: ['.content', 'main', '#content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'GNU Project',
    url: 'https://www.gnu.org',
    description: 'Fundación de software libre',
    category: 'tech',
    expectedSelectors: ['#content', 'main', '.inner'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    description: 'Proyecto colaborativo de mapeo',
    category: 'tech',
    expectedSelectors: ['#map', '.search_form', 'main'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Estándares Web y Especificaciones
  {
    name: 'W3C',
    url: 'https://www.w3.org',
    description: 'Consorcio World Wide Web',
    category: 'tech',
    expectedSelectors: ['main', '.content', '#w3c_mast'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'IETF',
    url: 'https://www.ietf.org',
    description: 'Grupo de Trabajo de Ingeniería de Internet',
    category: 'tech',
    expectedSelectors: ['main', '.content', '.navbar'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Universidades con Repositorios Abiertos
  {
    name: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu',
    description: 'Materiales de curso gratuitos del MIT',
    category: 'academic',
    expectedSelectors: ['.search-input', 'main', '.content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'Stanford Encyclopedia',
    url: 'https://plato.stanford.edu',
    description: 'Obra de referencia filosófica',
    category: 'academic',
    expectedSelectors: ['main', '.content', '#content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // Bases de Datos Científicas Abiertas
  {
    name: 'PubMed Central',
    url: 'https://www.ncbi.nlm.nih.gov/pmc',
    description: 'Archivo gratuito de literatura biomédica',
    category: 'academic',
    expectedSelectors: ['#term', 'main', '.content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },
  {
    name: 'ORCID',
    url: 'https://orcid.org',
    description: 'Registro de identificadores de investigadores',
    category: 'academic',
    expectedSelectors: ['.search-input', 'main', '.content'],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited'
    ],
    riskLevel: 'excellent'
  },

  // === PROXY LISTS WEBSITES ===
  // Sitios específicos de listas de proxies para análisis
  {
    name: 'SPYS.ONE',
    url: 'https://spys.one/en/free-proxy-list/',
    description: 'Lista de proxies gratuitos con información detallada',
    category: 'proxy',
    expectedSelectors: [
      'table', 
      '.proxy-table',
      'td',
      '[title*="proxy"]',
      'tr:has(td:contains(":"))'
    ],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited',
      'text=Cloudflare',
      'text=DDoS protection',
      'text=Please wait',
      '.cf-wrapper',
      '#cf-wrapper'
    ],
    riskLevel: 'medium'
  },
  {
    name: 'Proxy List Download',
    url: 'https://www.proxy-list.download/HTTPS',
    description: 'Lista de proxies HTTPS con información de velocidad y país',
    category: 'proxy',
    expectedSelectors: [
      'table',
      '#proxiesTable',
      '.proxy-table',
      'td',
      'tbody tr',
      '[data-label="IP Address"]'
    ],
    blockedIndicators: [
      'text=Access denied',
      'text=Rate limited',
      'text=Cloudflare',
      'text=Security check',
      'text=DDoS protection',
      'text=Unable to load the full list',
      'text=Some ad blockers may interfere',
      '.cf-wrapper'
    ],
    riskLevel: 'medium'
  }
];

// Agregar sitios excelentes a la lista principal
POPULAR_WEBSITES.push(...EXCELLENT_WEBSITES); 