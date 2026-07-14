import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LicensesSheet from './LicensesSheet.vue'

// BottomSheet teleports to <body>; unmount between tests so DOM selectors
// don't see stale instances from prior tests.
const wrappers: Array<VueWrapper<unknown>> = []
afterEach(() => {
  while (wrappers.length) {
    wrappers.pop()?.unmount()
  }
  document.body.innerHTML = ''
})

function mountSheet(options: Parameters<typeof mount>[1] = {}) {
  const w = mount(LicensesSheet, options) as VueWrapper<unknown>
  wrappers.push(w)
  return w
}

describe('LicensesSheet', () => {
  beforeAll(() => {
    if (typeof window === 'undefined' || window.localStorage) return
  })

  it('renders the expected dep list with verified license ids', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()

    const rows = document.querySelectorAll('.licenses-sheet__row')
    expect(rows.length).toBeGreaterThanOrEqual(9)

    const text = document.querySelector('.licenses-sheet__list')?.textContent ?? ''
    for (const name of [
      'Nuxt',
      'Vue',
      'Pinia',
      'Chart.js',
      'vue-chartjs',
      '@lucide/vue',
      '@google/genai',
      'Storybook',
      'Vitest',
    ]) {
      expect(text).toContain(name)
    }
  })

  it('shows the ISC license for @lucide/vue (not MIT)', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()

    const rows = document.querySelectorAll<HTMLElement>('.licenses-sheet__row')
    const lucide = Array.from(rows).find((r) => (r.textContent ?? '').includes('@lucide/vue'))
    expect(lucide?.querySelector('.licenses-sheet__license')?.textContent).toBe('ISC')
  })

  it('shows Apache-2.0 for @google/genai', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()

    const rows = document.querySelectorAll<HTMLElement>('.licenses-sheet__row')
    const genai = Array.from(rows).find((r) => (r.textContent ?? '').includes('@google/genai'))
    expect(genai?.querySelector('.licenses-sheet__license')?.textContent).toBe('Apache-2.0')
  })

  it('emits close via the BottomSheet close handler', async () => {
    const wrapper = mountSheet({ props: { open: true } })
    await flushPromises()
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })
})
