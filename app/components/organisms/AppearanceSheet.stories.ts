import type { Meta, StoryObj } from '@storybook/vue3'
import AppearanceSheet from './AppearanceSheet.vue'

const meta: Meta<typeof AppearanceSheet> = {
  title: 'Organisms/AppearanceSheet',
  component: AppearanceSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof AppearanceSheet>

export const Open: Story = {
  args: { open: true },
  render: (args) => ({
    components: { AppearanceSheet },
    setup: () => ({ args }),
    template: '<AppearanceSheet v-bind="args" @close="args.open = false" />',
  }),
}
