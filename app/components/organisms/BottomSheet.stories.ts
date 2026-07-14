import type { Meta, StoryObj } from '@storybook/vue3'
import BottomSheet from './BottomSheet.vue'

const meta: Meta<typeof BottomSheet> = {
  title: 'Organisms/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof BottomSheet>

export const Default: Story = {
  args: { open: true },
  render: (args) => ({
    components: { BottomSheet },
    setup: () => ({ args }),
    template: `
      <BottomSheet v-bind="args">
        <p>A plain body — no title, no footer. Slot content only.</p>
      </BottomSheet>
    `,
  }),
}

export const WithTitle: Story = {
  args: { open: true, title: 'Flight SI 204' },
  render: (args) => ({
    components: { BottomSheet },
    setup: () => ({ args }),
    template: `
      <BottomSheet v-bind="args">
        <p>MKW → WMX · 06:30 → 07:45 · C208B Grand Caravan</p>
      </BottomSheet>
    `,
  }),
}

export const WithFooter: Story = {
  args: { open: true, title: 'Confirm logbook entry' },
  render: (args) => ({
    components: { BottomSheet },
    setup: () => ({ args }),
    template: `
      <BottomSheet v-bind="args">
        <p>Add this flight to your logbook?</p>
        <template #footer>
          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button type="button">Cancel</button>
            <button type="button">Save entry</button>
          </div>
        </template>
      </BottomSheet>
    `,
  }),
}

export const LongContent: Story = {
  args: { open: true, title: 'Many legs' },
  render: (args) => ({
    components: { BottomSheet },
    setup: () => ({ args }),
    template: `
      <BottomSheet v-bind="args">
        <ul>
          <li v-for="n in 40" :key="n">Leg {{ n }} — sector detail row that repeats to force vertical scroll.</li>
        </ul>
      </BottomSheet>
    `,
  }),
}
