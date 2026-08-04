import type { Meta, StoryObj } from '@storybook/vue3'
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
    id: 'logbook-incomplete-2026-05-29',
    kind: 'logbook-incomplete',
    title: 'Logbook incomplete for 2026-05-29',
    body: '1/2 entries recorded',
    severity: 'warning',
    date: '2026-05-29',
  },
  {
    id: 'document-expired-license',
    kind: 'document-expired',
    title: 'License expired',
    body: 'Review by 2026-05-28',
    severity: 'danger',
    date: '2026-05-28',
  },
]

const meta: Meta<typeof ActionCenter> = {
  title: 'Organisms/ActionCenter',
  component: ActionCenter,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof ActionCenter>

export const Normal: Story = {
  args: { items },
}

export const Empty: Story = {
  args: { items: [] },
}

export const AttentionOnly: Story = {
  args: { items: items.slice(2) },
}
