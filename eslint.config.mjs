// Flat config for ESLint 10.
// @nuxt/eslint auto-generates `.nuxt/eslint.config.mjs` (a flat config array)
// at `nuxt prepare` time. We import it via `withNuxt` and append our own
// overrides / disables as a final config object.
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'vue/no-v-html': 'off',
  },
  ignores: ['node_modules/**', '.nuxt/**', '.output/**', 'dist/**', 'storybook-static/**', 'coverage/**'],
})
