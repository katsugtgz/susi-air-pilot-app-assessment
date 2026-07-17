import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionCenter from './ActionCenter.vue'
import type { ActionItem } from '~/composables/useActionItems'

const items: readonly ActionItem[] = [
  {
    id: 'next-duty-2026-05-31',
    kind: 'next-duty',
    title: 'Next duty PDG to MKW',
    body: 'SSI-2204 at 08:15, 2 leg(s) planned',
    severity: 'info',
    date: '2026-05-31',
  },
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
]

describe('ActionCenter', () => {
  it('groups next duty and attention without claiming live ops', () => {
    const wrapper = mount(ActionCenter, { props: { items } })

    expect(wrapper.find('section[aria-labelledby="action-center-next"]').text()).toContain(
      'Next duty PDG to MKW',
    )
    expect(wrapper.find('section[aria-labelledby="action-center-attention"]').text()).toContain(
      'License expired',
    )
    expect(wrapper.text()).toContain('Demo briefing from mock data')
  })

  it('renders an empty briefing state', () => {
    const wrapper = mount(ActionCenter, { props: { items: [] } })

    expect(wrapper.text()).toContain('No action items in this demo snapshot')
  })

  it('emits default navigation intent by item kind', async () => {
    const wrapper = mount(ActionCenter, { props: { items } })

    await wrapper.find('[data-action-id="document-expired-license"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([
      [{ item: items[1], to: '/documents', source: 'action-center' }],
    ])
  })

  it('prefers explicit route when supplied', async () => {
    const routedItems = [
      {
        id: 'next-duty-2026-05-31',
        kind: 'next-duty',
        title: 'Next duty PDG to MKW',
        body: 'SSI-2204 at 08:15, 2 leg(s) planned',
        severity: 'info',
        date: '2026-05-31',
        to: '/more',
      },
    ] as const
    const wrapper = mount(ActionCenter, { props: { items: routedItems } })

    await wrapper.find('[data-action-id="next-duty-2026-05-31"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([
      [{ item: routedItems[0], to: '/more', source: 'action-center' }],
    ])
  })
})
