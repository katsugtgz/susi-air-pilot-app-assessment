import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatMessage from './ChatMessage.vue'

describe('ChatMessage', () => {
  it('applies the user modifier on role=user', () => {
    const wrapper = mount(ChatMessage, { props: { role: 'user', text: 'hi' } })
    expect(wrapper.classes()).toContain('chat-message--user')
  })

  it('applies the assistant modifier on role=assistant', () => {
    const wrapper = mount(ChatMessage, { props: { role: 'assistant', text: 'hi' } })
    expect(wrapper.classes()).toContain('chat-message--assistant')
  })

  it('renders the text in the bubble', () => {
    const wrapper = mount(ChatMessage, { props: { role: 'user', text: 'Hello world' } })
    expect(wrapper.find('.chat-message__bubble').text()).toBe('Hello world')
  })

  it('renders the assistant avatar only for assistant role', () => {
    const assistant = mount(ChatMessage, { props: { role: 'assistant', text: 'hi' } })
    const user = mount(ChatMessage, { props: { role: 'user', text: 'hi' } })
    expect(assistant.find('.chat-message__avatar').exists()).toBe(true)
    expect(user.find('.chat-message__avatar').exists()).toBe(false)
  })

  it('preserves line breaks from streamed text (no markdown lib)', () => {
    const wrapper = mount(ChatMessage, {
      props: { role: 'assistant', text: 'Line 1\nLine 2' },
    })
    // The newline should be rendered — we use white-space: pre-wrap so the
    // raw \n appears in the DOM text.
    expect(wrapper.find('.chat-message__bubble').text()).toBe('Line 1\nLine 2')
  })
})
