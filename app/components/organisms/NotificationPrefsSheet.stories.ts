import type { Meta, StoryObj } from '@storybook/vue3'
import NotificationPrefsSheet from './NotificationPrefsSheet.vue'

const meta: Meta<typeof NotificationPrefsSheet> = {
  title: 'Organisms/NotificationPrefsSheet',
  component: NotificationPrefsSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof NotificationPrefsSheet>

export const Open: Story = {
  args: { open: true },
  render: (args) => ({
    components: { NotificationPrefsSheet },
    setup: () => ({ args }),
    template: '<NotificationPrefsSheet v-bind="args" @close="args.open = false" />',
  }),
}
