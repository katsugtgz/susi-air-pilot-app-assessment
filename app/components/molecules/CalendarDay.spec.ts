import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarDay from './CalendarDay.vue'

describe('CalendarDay — tick vs number logic', () => {
  it('shows a tick when count_logbooks === count_schedules (>0)', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        dayNumber: 14,
        baseColor: '#10B981',
        baseName: 'SIQ',
        dutyType: 'DTY',
        countSchedules: 6,
        countLogbooks: 6,
      },
    })
    expect(wrapper.find('.calendar-day__tick').exists()).toBe(true)
    expect(wrapper.find('.calendar-day__count').exists()).toBe(false)
  })

  it('shows the count number when logbooks === 0', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        dayNumber: 21,
        baseColor: '#10B981',
        baseName: 'CJN',
        dutyType: 'DTY',
        countSchedules: 4,
        countLogbooks: 0,
      },
    })
    expect(wrapper.find('.calendar-day__count').exists()).toBe(true)
    expect(wrapper.find('.calendar-day__count').text()).toBe('4')
    expect(wrapper.find('.calendar-day__tick').exists()).toBe(false)
  })

  it('shows the count number when logbooks is partially done', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        dayNumber: 13,
        dutyType: 'DTY',
        countSchedules: 4,
        countLogbooks: 2,
      },
    })
    expect(wrapper.find('.calendar-day__count').text()).toBe('4')
    expect(wrapper.find('.calendar-day__tick').exists()).toBe(false)
  })

  it('renders NO tick and NO count when both counts are 0', () => {
    // Even though "0 === 0", a cell with zero scheduled duties is not "complete".
    const wrapper = mount(CalendarDay, {
      props: { dayNumber: 5, dutyType: '', countSchedules: 0, countLogbooks: 0 },
    })
    expect(wrapper.find('.calendar-day__tick').exists()).toBe(false)
    expect(wrapper.find('.calendar-day__count').exists()).toBe(false)
  })

  it('renders NO badge for empty (no dutyType) cells', () => {
    const wrapper = mount(CalendarDay, { props: { dayNumber: 5 } })
    expect(wrapper.find('.calendar-day__count').exists()).toBe(false)
    expect(wrapper.find('.calendar-day__tick').exists()).toBe(false)
    expect(wrapper.classes()).toContain('calendar-day--empty')
  })
})

describe('CalendarDay — modifiers', () => {
  it('applies out-of-month modifier', () => {
    const wrapper = mount(CalendarDay, { props: { dayNumber: 28, isOutOfMonth: true } })
    expect(wrapper.classes()).toContain('calendar-day--out')
  })

  it('applies today modifier', () => {
    const wrapper = mount(CalendarDay, { props: { dayNumber: 31, isToday: true } })
    expect(wrapper.classes()).toContain('calendar-day--today')
  })

  it('shows the base name when provided', () => {
    const wrapper = mount(CalendarDay, {
      props: { dayNumber: 1, dutyType: 'DTY', baseName: 'MKW' },
    })
    expect(wrapper.find('.calendar-day__base').text()).toBe('MKW')
  })

  it('tints the cell via --day-color CSS variable', () => {
    const wrapper = mount(CalendarDay, {
      props: { dayNumber: 1, dutyType: 'DTY', baseColor: '#10B981' },
    })
    expect(wrapper.attributes('style') || '').toContain('--day-color')
  })

  it('does not set --day-color for empty cells', () => {
    const wrapper = mount(CalendarDay, { props: { dayNumber: 5 } })
    expect(wrapper.attributes('style') || '').not.toContain('--day-color')
  })
})

describe('CalendarDay — accessibility (button)', () => {
  it('renders a real <button> root element', () => {
    const wrapper = mount(CalendarDay, { props: { dayNumber: 15 } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('builds a descriptive aria-label from props', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: '2026-05-15',
        dayNumber: 15,
        dutyType: 'DTY',
        countSchedules: 4,
        countLogbooks: 3,
      },
    })
    const label = wrapper.attributes('aria-label')
    expect(label).toContain('15 May')
    expect(label).toContain('DTY')
    expect(label).toContain('4 flights')
    expect(label).toContain('3 logged')
  })

  it('aria-label omits flights when none scheduled', () => {
    const wrapper = mount(CalendarDay, {
      props: { date: '2026-05-20', dayNumber: 20 },
    })
    const label = wrapper.attributes('aria-label')
    expect(label).toContain('20 May')
    expect(label).not.toContain('flight')
  })

  it('emits click on Enter key (native button behavior)', async () => {
    const wrapper = mount(CalendarDay, {
      props: { date: '2026-05-15', dayNumber: 15, dutyType: 'DTY' },
    })
    await wrapper.trigger('click')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })
})
