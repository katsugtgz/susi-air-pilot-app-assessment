import type { Meta, StoryObj } from '@storybook/vue3'
import ChatMessage from './ChatMessage.vue'

const meta: Meta<typeof ChatMessage> = {
  title: 'Molecules/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  render: (args) => ({
    components: { ChatMessage },
    setup: () => ({ args }),
    template: '<ChatMessage v-bind="args" />',
  }),
}
export default meta

type Story = StoryObj<typeof ChatMessage>

export const UserMessage: Story = {
  args: { role: 'user', text: 'When is my next flight?' },
}

export const AssistantMessage: Story = {
  args: {
    role: 'assistant',
    text: 'Your next duty is on 2026-05-15 at MKW — 6 flights planned.',
  },
}

export const MultilineAssistant: Story = {
  args: {
    role: 'assistant',
    text: 'Two items need attention:\n• Medical expires in 11 days\n• License expired 2 days ago',
  },
}
