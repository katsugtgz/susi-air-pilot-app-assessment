import type { Meta, StoryObj } from '@storybook/vue3'
import LogbookEntrySheet from './LogbookEntrySheet.vue'

const meta: Meta<typeof LogbookEntrySheet> = {
  title: 'Organisms/LogbookEntrySheet',
  component: LogbookEntrySheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof LogbookEntrySheet>

export const Default: Story = {
  render: () => ({
    components: { LogbookEntrySheet },
    setup: () => ({ open: true, defaultDate: '2026-05-15' }),
    template:
      '<LogbookEntrySheet :open="open" :default-date="defaultDate" @submit="() => {}" @close="() => {}" />',
  }),
}
