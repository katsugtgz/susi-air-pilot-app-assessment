import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToggleSwitch from './ToggleSwitch.vue'

describe('ToggleSwitch', () => {
  it('renders role=switch with aria-checked=false when off', () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: false } })
    expect(wrapper.attributes('role')).toBe('switch')
    expect(wrapper.attributes('aria-checked')).toBe('false')
  })

  it('aria-checked becomes true when on', () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
    expect(wrapper.classes()).toContain('toggle-switch--on')
  })

  it('emits update:modelValue with the next state on click', async () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('clicking an on switch turns it off', async () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(ToggleSwitch, {
      props: { modelValue: false, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    // Boolean attribute renders as presence ("") not "true".
    expect(wrapper.attributes('disabled')).toBe('')
  })

  it('toggles on Space key', async () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: false } })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('toggles on Enter key', async () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: true } })
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('ignores other keys', async () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: false } })
    await wrapper.trigger('keydown', { key: 'a' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not toggle on keys when disabled', async () => {
    const wrapper = mount(ToggleSwitch, {
      props: { modelValue: false, disabled: true },
    })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('forwards ariaLabel to aria-label', () => {
    const wrapper = mount(ToggleSwitch, {
      props: { modelValue: false, ariaLabel: 'Enable notifications' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Enable notifications')
  })
})
