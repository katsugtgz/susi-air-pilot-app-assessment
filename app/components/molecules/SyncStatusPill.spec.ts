import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SyncStatusPill from './SyncStatusPill.vue'

describe('SyncStatusPill', () => {
  it('labels online demo state as mock snapshot with no write sync', () => {
    const wrapper = mount(SyncStatusPill, { props: { timestamp: '2026-05-31 09:14' } })

    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.text()).toContain('Demo data')
    expect(wrapper.text()).toContain('Mock snapshot')
    expect(wrapper.text()).toContain('No write sync')
    expect(wrapper.text()).toContain('2026-05-31 09:14')
  })

  it('tracks offline client events as cached shell', async () => {
    const wrapper = mount(SyncStatusPill)

    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()

    expect(wrapper.classes()).toContain('sync-status-pill--offline')
    expect(wrapper.text()).toContain('Offline')
    expect(wrapper.text()).toContain('Cached shell')
    expect(wrapper.text()).toContain('No write sync')
  })
})
