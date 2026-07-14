import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OfflineBanner from './OfflineBanner.vue'

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not render when online', () => {
    const wrapper = mount(OfflineBanner)
    expect(wrapper.find('.offline-banner').exists()).toBe(false)
  })

  it('renders when navigator.onLine is false', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const wrapper = mount(OfflineBanner)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.offline-banner').exists()).toBe(true)
  })

  it('has role="status" for assistive technology', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const wrapper = mount(OfflineBanner)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.offline-banner').attributes('role')).toBe('status')
  })

  it('shows the offline message text', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const wrapper = mount(OfflineBanner)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.offline-banner__text').text()).toContain('offline')
    expect(wrapper.find('.offline-banner__text').text()).toContain('cached')
  })

  it('responds to offline window event', async () => {
    const wrapper = mount(OfflineBanner)
    expect(wrapper.find('.offline-banner').exists()).toBe(false)

    vi.stubGlobal('navigator', { onLine: false })
    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.offline-banner').exists()).toBe(true)
  })

  it('responds to online window event', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const wrapper = mount(OfflineBanner)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.offline-banner').exists()).toBe(true)

    vi.stubGlobal('navigator', { onLine: true })
    window.dispatchEvent(new Event('online'))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.offline-banner').exists()).toBe(false)
  })

  it('removes event listeners on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(OfflineBanner)
    wrapper.unmount()
    expect(spy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(spy).toHaveBeenCalledWith('offline', expect.any(Function))
    spy.mockRestore()
  })
})
