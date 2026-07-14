import type { Meta, StoryObj } from '@storybook/vue3'
import CopilotBubble from './CopilotBubble.vue'

const meta: Meta<typeof CopilotBubble> = {
  title: 'Organisms/CopilotBubble',
  component: CopilotBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
}
export default meta

type Story = StoryObj<typeof CopilotBubble>

export const Default: Story = {
  render: () => ({
    components: { CopilotBubble },
    template: '<CopilotBubble />',
  }),
}
