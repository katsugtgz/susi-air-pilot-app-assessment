import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionCenter from './ActionCenter.vue'
import type { ActionItem } from '~/composables/useOpsBriefing'

const items: readonly ActionItem[] = [
  {
    id: 'document-expired-license',
    kind: 'document-expired',
    title: 'License expired',
    body: 'Review by 2026-05-28',
    severity: 'danger',
    date: '2026-05-28',
  },
  {
    id: 'logbook-incomplete-2026-05-29',
    kind: 'logbook-incomplete',
    title: 'Logbook incomplete for 2026-05-29',
    body: '1/2 entries recorded',
    severity: 'warning',
    date: '2026-05-29',
  },
  {
    id: 'next-duty-2026-05-31',
    kind: 'next-duty',
    title: 'Next duty MKW → INX',
    body: 'SI 257 at 06:45, 2 leg(s) planned',
    severity: 'info',
    date: '2026-05-31',
  },
]

describe('ActionCenter', () => {
  it('renders ranked action items with open count badge', () => {
    const wrapper = mount(ActionCenter, { props: { items } })

    expect(wrapper.text()).toContain('3 open')
    expect(wrapper.findAll('button.action-center__row')).toHaveLength(3)
    expect(wrapper.text()).toContain('License expired')
    expect(wrapper.text()).toContain('Next duty MKW → INX')
  })

  it('renders an empty state when no actions are open', () => {
    const wrapper = mount(ActionCenter, { props: { items: [] } })

    expect(wrapper.text()).toContain('All clear')
    expect(wrapper.text()).toContain('No open actions right now.')
    expect(wrapper.find('ul.action-center__list').exists()).toBe(false)
  })

  it('emits default route by item kind', async () => {
    const wrapper = mount(ActionCenter, { props: { items } })

    await wrapper.find('[data-action-id="document-expired-license"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([[{ item: items[0], to: '/documents' }]])
  })

  it('prefers explicit route when supplied', async () => {
    const routed = [{ ...items[2]!, to: '/more' }]
    const wrapper = mount(ActionCenter, { props: { items: routed } })

    await wrapper.find('[data-action-id="next-duty-2026-05-31"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([[{ item: routed[0], to: '/more' }]])
  })
})
