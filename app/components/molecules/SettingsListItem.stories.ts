import type { Meta, StoryObj } from '@storybook/vue3'
import SettingsListItem from './SettingsListItem.vue'

const meta: Meta<typeof SettingsListItem> = {
  title: 'Molecules/SettingsListItem',
  component: SettingsListItem,
  tags: ['autodocs'],
  render: (args) => ({
    components: { SettingsListItem },
    setup: () => ({ args }),
    template: '<SettingsListItem v-bind="args" />',
  }),
}
export default meta

type Story = StoryObj<typeof SettingsListItem>

export const WithChevron: Story = {
  args: { label: 'Documents', icon: 'file-text', trailing: 'chevron' },
}

export const WithSoonBadge: Story = {
  args: { label: 'Appearance', icon: 'info', trailing: 'badge', badgeLabel: 'Soon', badgeVariant: 'soon' },
}

export const VersionInfo: Story = {
  args: { label: 'App version', icon: 'info', trailing: 'badge', badgeLabel: 'v1.0.0', badgeVariant: 'neutral' },
}

export const SignOut: Story = {
  args: { label: 'Sign out', icon: 'log-out', danger: true, trailing: 'none' },
}

export const AsLink: Story = {
  args: { label: 'Licenses', icon: 'file-text', as: 'link', href: '#', trailing: 'chevron' },
}
