import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CopilotSheet from './CopilotSheet.vue'
import type { CopilotMessage } from '~/composables/useCopilotChat'

const baseProps = {
  open: true,
  messages: [] as CopilotMessage[],
  isStreaming: false,
  error: null,
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CopilotSheet', () => {
  it('does not render when closed', () => {
    mount(CopilotSheet, { props: { ...baseProps, open: false } })
    expect(document.querySelector('.copilot-sheet')).toBeNull()
  })

  it('renders a dialog with aria-modal when open', () => {
    mount(CopilotSheet, { props: baseProps })
    const dlg = document.querySelector('.copilot-sheet')
    expect(dlg).not.toBeNull()
    expect(dlg?.getAttribute('role')).toBe('dialog')
    expect(dlg?.getAttribute('aria-modal')).toBe('true')
  })

  it('shows template prompts when empty', () => {
    mount(CopilotSheet, { props: baseProps })
    const prompts = document.querySelectorAll('.copilot-sheet__prompt')
    expect(prompts.length).toBe(4)
    expect(prompts[0]?.textContent?.trim()).toBe('When is my next flight?')
  })

  it('hides prompts once messages exist', () => {
    mount(CopilotSheet, {
      props: {
        ...baseProps,
        messages: [{ id: 'm1', role: 'user', text: 'hi' }],
      },
    })
    expect(document.querySelectorAll('.copilot-sheet__prompt').length).toBe(0)
  })

  it('renders ChatMessage rows for each message', () => {
    mount(CopilotSheet, {
      props: {
        ...baseProps,
        messages: [
          { id: 'm1', role: 'user', text: 'hi' },
          { id: 'm2', role: 'assistant', text: 'hello' },
        ],
      },
    })
    expect(document.querySelectorAll('.chat-message').length).toBe(2)
  })

  it('shows typing indicator only while streaming', async () => {
    const wrapper = mount(CopilotSheet, {
      props: { ...baseProps, messages: [{ id: 'm1', role: 'user', text: 'hi' }] },
    })
    expect(document.querySelector('.copilot-sheet__typing')).toBeNull()
    await wrapper.setProps({ isStreaming: true })
    expect(document.querySelector('.copilot-sheet__typing')).not.toBeNull()
  })

  it('emits send when a prompt chip is clicked', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    const prompt = document.querySelector('.copilot-sheet__prompt') as HTMLButtonElement
    prompt.click()
    await flushPromises()
    const sendEvents = wrapper.emitted('send')
    expect(sendEvents).toBeDefined()
    expect(sendEvents?.[0]?.[0]).toBe('When is my next flight?')
  })

  it('emits send when the form is submitted with text', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    const input = document.querySelector('.copilot-sheet__input') as HTMLInputElement
    input.value = 'How are you?'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    const form = document.querySelector('.copilot-sheet__form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()
    const sendEvents = wrapper.emitted('send')
    expect(sendEvents?.[0]?.[0]).toBe('How are you?')
  })

  it('does not send empty drafts', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    const form = document.querySelector('.copilot-sheet__form') as HTMLFormElement
    form.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(wrapper.emitted('send')).toBeUndefined()
  })

  it('emits close on backdrop click', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    const backdrop = document.querySelector('.copilot-sheet__backdrop') as HTMLElement
    // click on backdrop itself (not inside the dialog)
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('emits close on Esc key', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('emits close on the close button click', async () => {
    const wrapper = mount(CopilotSheet, { props: baseProps })
    const btn = document.querySelector('.copilot-sheet__close') as HTMLButtonElement
    btn.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('shows the error message when set', () => {
    mount(CopilotSheet, { props: { ...baseProps, error: 'oops' } })
    expect(document.querySelector('.copilot-sheet__error')?.textContent).toContain('oops')
  })

  it('disables prompt + send controls while streaming', async () => {
    mount(CopilotSheet, {
      props: {
        ...baseProps,
        isStreaming: true,
        messages: [{ id: 'm1', role: 'user', text: 'hi' }],
      },
    })
    // Messages view (prompts not rendered). Test send button + input.
    const send = document.querySelector('.copilot-sheet__send') as HTMLButtonElement
    const input = document.querySelector('.copilot-sheet__input') as HTMLInputElement
    expect(send.disabled).toBe(true)
    expect(input.disabled).toBe(true)
  })
})
