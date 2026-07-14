import type { Meta, StoryObj } from '@storybook/vue3'
import { onMounted } from 'vue'
import OfflineBanner from './OfflineBanner.vue'

const meta: Meta<typeof OfflineBanner> = {
  title: 'Atoms/OfflineBanner',
  component: OfflineBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Slim status banner shown when the browser goes offline. Listens to online/offline window events and slides in from the top.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof OfflineBanner>

export const Online: Story = {
  render: () => ({
    components: { OfflineBanner },
    template: '<div style="min-height:60px"><OfflineBanner /></div>',
  }),
}

export const Offline: Story = {
  render: () => ({
    components: { OfflineBanner },
    setup() {
      onMounted(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        window.dispatchEvent(new Event('offline'))
      })
    },
    template: '<div style="min-height:60px"><OfflineBanner /></div>',
  }),
}
