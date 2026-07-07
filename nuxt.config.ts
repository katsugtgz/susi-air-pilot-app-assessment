// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxt/fonts'],

  css: ['~/assets/scss/tokens.scss'],

  app: {
    head: {
      title: 'Susi Air Pilot App',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  // @nuxt/fonts auto-detects `font-family: 'Plus Jakarta Sans'` in tokens.scss
  // and serves the font from our own origin (no Google Fonts request).
  // We declare weights/styles explicitly because our CSS uses them via
  // custom properties (var(--fw-bold) etc.) which the scanner can't trace.
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
})
