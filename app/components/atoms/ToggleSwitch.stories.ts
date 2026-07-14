import type { Meta, StoryObj } from '@storybook/vue3'
import ToggleSwitch from './ToggleSwitch.vue'

const meta: Meta<typeof ToggleSwitch> = {
  title: 'Atoms/ToggleSwitch',
  component: ToggleSwitch,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof ToggleSwitch>

export const Off: Story = {
  args: { modelValue: false, ariaLabel: 'Off example' },
  render: (args) => ({
    components: { ToggleSwitch },
    setup: () => ({ args }),
    template: '<ToggleSwitch v-bind="args" />',
  }),
}

export const On: Story = {
  args: { modelValue: true, ariaLabel: 'On example' },
  render: (args) => ({
    components: { ToggleSwitch },
    setup: () => ({ args }),
    template: '<ToggleSwitch v-bind="args" />',
  }),
}

export const Disabled: Story = {
  args: { modelValue: false, disabled: true, ariaLabel: 'Disabled example' },
  render: (args) => ({
    components: { ToggleSwitch },
    setup: () => ({ args }),
    template: '<ToggleSwitch v-bind="args" />',
  }),
}

export const DisabledOn: Story = {
  args: { modelValue: true, disabled: true, ariaLabel: 'Disabled on example' },
  render: (args) => ({
    components: { ToggleSwitch },
    setup: () => ({ args }),
    template: '<ToggleSwitch v-bind="args" />',
  }),
}
