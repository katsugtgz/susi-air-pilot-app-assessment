import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataFreshnessStrip from './DataFreshnessStrip.vue'
import type { DemoTimeline } from '~/composables/useDemoTimeline'

const timeline: DemoTimeline = {
  latestDataDate: '2026-05-31',
  statusText: 'Demo data is current through 2026-05-31',
  sources: [
    { id: 'schedule', label: 'Schedule', asOfDate: '2026-05-31' },
    { id: 'documents', label: 'Documents', asOfDate: '2026-05-30' },
    { id: 'flight-hours', label: 'Flight hours', asOfDate: '2026-05-29' },
  ],
}

describe('DataFreshnessStrip', () => {
  it('shows demo freshness with source dates', () => {
    const wrapper = mount(DataFreshnessStrip, { props: { timeline } })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Demo data is current through 2026-05-31')
    expect(wrapper.text()).toContain('Schedule 2026-05-31')
    expect(wrapper.text()).toContain('Mock JSON snapshot')
  })

  it('emits details when the optional action is clicked', async () => {
    const wrapper = mount(DataFreshnessStrip, {
      props: { timeline, detailsLabel: 'View sources' },
    })

    await wrapper.find('button.data-freshness-strip__details').trigger('click')

    expect(wrapper.emitted('details')).toHaveLength(1)
  })

  it('marks offline copy without implying live sync', () => {
    const wrapper = mount(DataFreshnessStrip, { props: { timeline, variant: 'offline' } })

    expect(wrapper.classes()).toContain('data-freshness-strip--offline')
    expect(wrapper.text()).toContain('Offline')
    expect(wrapper.text()).toContain('cached shell')
  })
})
