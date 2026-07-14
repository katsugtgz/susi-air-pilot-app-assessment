import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsListItem from './SettingsListItem.vue'

describe('SettingsListItem', () => {
  it('renders the label', () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'Notifications' } })
    expect(wrapper.find('.settings-list-item__label').text()).toBe('Notifications')
  })

  it('renders as a button by default', () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X' } })
    expect(wrapper.find('button.settings-list-item').exists()).toBe(true)
    expect(wrapper.find('a.settings-list-item').exists()).toBe(false)
  })

  it('renders as an anchor when as=link + href', () => {
    const wrapper = mount(SettingsListItem, {
      props: { label: 'Licenses', as: 'link', href: '/licenses' },
    })
    const a = wrapper.find('a.settings-list-item')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toBe('/licenses')
  })

  it('renders an icon when provided', () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X', icon: 'bell' } })
    expect(wrapper.find('.settings-list-item__icon').exists()).toBe(true)
  })

  it('omits the icon wrapper when icon is missing', () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X' } })
    expect(wrapper.find('.settings-list-item__icon').exists()).toBe(false)
  })

  it('renders a trailing Badge when trailing=badge', () => {
    const wrapper = mount(SettingsListItem, {
      props: { label: 'Appearance', trailing: 'badge', badgeLabel: 'Soon', badgeVariant: 'soon' },
    })
    const badge = wrapper.find('.badge')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('badge--soon')
    expect(wrapper.find('.badge__label').text()).toBe('Soon')
  })

  it('renders a trailing chevron Icon when trailing=chevron', () => {
    const wrapper = mount(SettingsListItem, {
      props: { label: 'Documents', trailing: 'chevron' },
    })
    expect(wrapper.find('.settings-list-item__trailing .icon').exists()).toBe(true)
  })

  it('applies the danger modifier', () => {
    const wrapper = mount(SettingsListItem, {
      props: { label: 'Sign out', danger: true, icon: 'log-out' },
    })
    expect(wrapper.classes()).toContain('settings-list-item--danger')
    expect(wrapper.find('.settings-list-item__icon--danger').exists()).toBe(true)
  })

  it('emits click when clicked (button)', async () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X', disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('disables the button via disabled attr', () => {
    const wrapper = mount(SettingsListItem, { props: { label: 'X', disabled: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
