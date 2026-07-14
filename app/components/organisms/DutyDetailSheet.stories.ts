import type { Meta, StoryObj } from '@storybook/vue3'
import DutyDetailSheet from './DutyDetailSheet.vue'
import type { FlightLeg, Legend, Schedule } from '~/types'

const LEGEND: Legend[] = [
  { code: 'DTY', label: 'On Duty', color: '#10B981' },
  { code: 'RLV', label: 'Requested Leave', color: '#475569' },
  { code: 'TRX', label: 'Training', color: '#F59E0B' },
]

function leg(partial: Partial<FlightLeg>): FlightLeg {
  return {
    flightNumber: 'SI 254',
    from: 'MKW',
    to: 'DJJ',
    std: '06:00',
    sta: '06:49',
    aircraft: 'PK-BVJ · C208B Grand Caravan',
    blockTime: '0:49',
    ...partial,
  }
}

const meta: Meta<typeof DutyDetailSheet> = {
  title: 'Organisms/DutyDetailSheet',
  component: DutyDetailSheet,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof DutyDetailSheet>

export const DutyDayFullyLogged: Story = {
  name: 'DTY day — fully logged',
  render: () => ({
    components: { DutyDetailSheet },
    setup: () => ({
      open: true,
      schedule: {
        id: '97000',
        duty_date: '2026-04-01',
        status: 2,
        base_name: 'MKW',
        base_color: '#10B981',
        duty_type: 'DTY',
        count_schedules: 4,
        count_logbooks: 4,
      } as Schedule,
      legend: LEGEND,
      legsByDate: {
        '2026-04-01': [
          leg({}),
          leg({ flightNumber: 'SI 255', from: 'DJJ', to: 'MKW', std: '07:12', sta: '08:14', blockTime: '1:02' }),
          leg({ flightNumber: 'SI 256', from: 'MKW', to: 'KEQ', std: '08:48', sta: '09:53', blockTime: '1:05' }),
          leg({ flightNumber: 'SI 257', from: 'KEQ', to: 'MKW', std: '10:22', sta: '11:05', blockTime: '0:43' }),
        ],
      },
    }),
    template: '<DutyDetailSheet :open="open" :schedule="schedule" :legend="legend" :legs-by-date="legsByDate" />',
  }),
}

export const DutyDayPartiallyLogged: Story = {
  name: 'DTY day — partially logged',
  render: () => ({
    components: { DutyDetailSheet },
    setup: () => ({
      open: true,
      schedule: {
        id: '97001',
        duty_date: '2026-04-10',
        status: 2,
        base_name: 'CJN',
        base_color: '#10B981',
        duty_type: 'DTY',
        count_schedules: 4,
        count_logbooks: 2,
      } as Schedule,
      legend: LEGEND,
      legsByDate: {
        '2026-04-10': [
          leg({}),
          leg({ flightNumber: 'SI 255', from: 'DJJ', to: 'MKW' }),
          leg({ flightNumber: 'SI 256', from: 'MKW', to: 'KEQ' }),
          leg({ flightNumber: 'SI 257', from: 'KEQ', to: 'MKW' }),
        ],
      },
    }),
    template: '<DutyDetailSheet :open="open" :schedule="schedule" :legend="legend" :legs-by-date="legsByDate" />',
  }),
}

export const LeaveDay: Story = {
  name: 'Leave day — empty state',
  render: () => ({
    components: { DutyDetailSheet },
    setup: () => ({
      open: true,
      schedule: {
        id: '97002',
        duty_date: '2026-04-08',
        status: 2,
        base_name: 'HLP',
        base_color: '#475569',
        duty_type: 'RLV',
        count_schedules: 1,
        count_logbooks: 1,
      } as Schedule,
      legend: LEGEND,
      legsByDate: {},
    }),
    template: '<DutyDetailSheet :open="open" :schedule="schedule" :legend="legend" :legs-by-date="legsByDate" />',
  }),
}

export const NoSchedule: Story = {
  name: 'No duty scheduled',
  render: () => ({
    components: { DutyDetailSheet },
    setup: () => ({
      open: true,
      schedule: null,
      legend: LEGEND,
      legsByDate: {},
    }),
    template: '<DutyDetailSheet :open="open" :schedule="schedule" :legend="legend" :legs-by-date="legsByDate" />',
  }),
}
