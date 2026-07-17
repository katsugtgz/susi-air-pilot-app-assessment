import type { Meta, StoryObj } from '@storybook/vue3'
import SyncStatusPill from './SyncStatusPill.vue'

const meta: Meta<typeof SyncStatusPill> = {
  title: 'Molecules/SyncStatusPill',
  component: SyncStatusPill,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof SyncStatusPill>

export const Demo: Story = {
  args: { timestamp: '2026-05-31 09:14' },
}

export const Offline: Story = {
  args: { status: 'offline', timestamp: 'cached' },
}

export const Stale: Story = {
  args: { status: 'stale', timestamp: '2026-05-29 17:00' },
}

export const Synced: Story = {
  args: { status: 'synced', timestamp: '2026-05-31 09:14' },
}

export const Syncing: Story = {
  args: { status: 'syncing', timestamp: 'now' },
}

export const Failed: Story = {
  args: { status: 'failed', timestamp: '2026-05-31 09:14' },
}
