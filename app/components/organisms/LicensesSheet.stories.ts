import type { Meta, StoryObj } from '@storybook/vue3'
import LicensesSheet from './LicensesSheet.vue'

const meta: Meta<typeof LicensesSheet> = {
  title: 'Organisms/LicensesSheet',
  component: LicensesSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof LicensesSheet>

export const Open: Story = {
  args: { open: true },
  render: (args) => ({
    components: { LicensesSheet },
    setup: () => ({ args }),
    template: '<LicensesSheet v-bind="args" @close="args.open = false" />',
  }),
}
