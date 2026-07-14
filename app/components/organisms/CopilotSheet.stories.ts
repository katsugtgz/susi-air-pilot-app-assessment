import type { Meta, StoryObj } from '@storybook/vue3'
import CopilotSheet from './CopilotSheet.vue'

const meta: Meta<typeof CopilotSheet> = {
  title: 'Organisms/CopilotSheet',
  component: CopilotSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof CopilotSheet>

export const Empty: Story = {
  args: { open: true, messages: [], isStreaming: false, error: null },
  render: (args) => ({
    components: { CopilotSheet },
    setup: () => ({ args }),
    template: '<CopilotSheet v-bind="args" />',
  }),
}

export const WithConversation: Story = {
  args: {
    open: true,
    messages: [
      { id: 'm1', role: 'user', text: 'When is my next flight?' },
      {
        id: 'm2',
        role: 'assistant',
        text: 'Your next duty is 2026-05-15 at MKW — 6 flights planned.',
      },
    ],
    isStreaming: false,
    error: null,
  },
  render: (args) => ({
    components: { CopilotSheet },
    setup: () => ({ args }),
    template: '<CopilotSheet v-bind="args" />',
  }),
}

export const Streaming: Story = {
  args: {
    open: true,
    messages: [{ id: 'm1', role: 'user', text: 'Summarize the news' }],
    isStreaming: true,
    error: null,
  },
  render: (args) => ({
    components: { CopilotSheet },
    setup: () => ({ args }),
    template: '<CopilotSheet v-bind="args" />',
  }),
}

export const ErrorState: Story = {
  args: {
    open: true,
    messages: [],
    isStreaming: false,
    error: 'Copilot request failed (500)',
  },
  render: (args) => ({
    components: { CopilotSheet },
    setup: () => ({ args }),
    template: '<CopilotSheet v-bind="args" />',
  }),
}
