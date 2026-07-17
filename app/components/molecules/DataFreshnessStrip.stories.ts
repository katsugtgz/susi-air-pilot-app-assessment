import type { Meta, StoryObj } from '@storybook/vue3'
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

const meta: Meta<typeof DataFreshnessStrip> = {
  title: 'Molecules/DataFreshnessStrip',
  component: DataFreshnessStrip,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof DataFreshnessStrip>

export const Demo: Story = {
  args: { timeline, detailsLabel: 'View sources' },
}

export const Offline: Story = {
  args: { timeline, variant: 'offline', detailsLabel: 'Why offline?' },
}

export const Error: Story = {
  args: { timeline, variant: 'error' },
}
