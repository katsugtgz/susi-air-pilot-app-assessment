// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/fonts'],

  // Register all components under app/components/ by filename only, ignoring
  // the atoms/molecules/organisms subdirectory prefix. So
  //   app/components/organisms/SignInForm.vue → <SignInForm />
  // instead of <OrganismsSignInForm />. Matches the convention the templates use.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/scss/tokens.scss', '~/assets/css/transitions-root.css'],

  app: {
    head: {
      title: 'Susi Air Pilot App',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          name: 'description',
          content:
            'Pilot companion app for Susi Air crew - duty schedule calendar, rolling flight-hour limits, document expiry tracking, and crew news.',
        },
        { name: 'format-detection', content: 'telephone=no' },
        // iOS Safari standalone support (manifest spec isn't fully honored).
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Susi Air' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#0E2138' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/pwa-192.png' },
      ],
      // Pre-paint theme bootstrap — synchronously sets data-theme from
      // localStorage in <head> to avoid a palette flash on reload.
      script: [
        {
          innerHTML: `(function(){try{var p=localStorage.getItem('susi:theme')||'system';var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');var d=p==='dark'||(p==='system'&&m&&m.matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`,
          tagPosition: 'head',
        },
      ],
    },
  },

  // @nuxt/fonts auto-detects `font-family: 'Plus Jakarta Sans'` in tokens.scss
  // and serves the font from our own origin (no Google Fonts request).
  fonts: {
    families: [
      {
        name: 'Plus Jakarta Sans',
        provider: 'google',
        weights: [400, 500, 600, 700, 800],
        styles: ['normal'],
      },
    ],
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api', 'import'],
        },
      },
    },
  },

  typescript: {
    strict: true,
  },

  // AI Copilot config — server-only. NEVER expose these under .public.
  // Keys rotate via `server/utils/gemini.ts` `withKeyRotation`.
  runtimeConfig: {
    geminiApiKeys: '', // NUXT_GEMINI_API_KEYS — comma-separated
    geminiApiKey: '', // NUXT_GEMINI_API_KEY — single fallback
    geminiChatModel: 'gemini-3-flash-preview',
    geminiEmbeddingModel: 'gemini-embedding-001',
  },
})

