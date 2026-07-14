import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BottomSheet from './BottomSheet.vue'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('BottomSheet', () => {
  it('does not render when closed', () => {
    mount(BottomSheet, { props: { open: false } })
    expect(document.querySelector('.bottom-sheet')).toBeNull()
  })

  it('renders a role=dialog with aria-modal when open', () => {
    mount(BottomSheet, { props: { open: true } })
    const dlg = document.querySelector('.bottom-sheet') as HTMLElement
    expect(dlg).not.toBeNull()
    expect(dlg.getAttribute('role')).toBe('dialog')
    expect(dlg.getAttribute('aria-modal')).toBe('true')
  })

  it('renders the default slot body content', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p class="bd">hello</p>' },
    })
    expect(document.querySelector('.bottom-sheet__body .bd')?.textContent).toBe('hello')
  })

  it('renders the optional footer slot', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { footer: '<button class="ft">Save</button>' },
    })
    expect(document.querySelector('.bottom-sheet__footer .ft')).not.toBeNull()
  })

  it('omits the footer container when no footer slot is provided', () => {
    mount(BottomSheet, { props: { open: true }, slots: { default: 'body' } })
    expect(document.querySelector('.bottom-sheet__footer')).toBeNull()
  })

  it('shows the title header when title prop is set', () => {
    mount(BottomSheet, { props: { open: true, title: 'Flight detail' } })
    const title = document.querySelector('.bottom-sheet__title')
    expect(title?.textContent).toBe('Flight detail')
  })

  it('aria-labels by title when title is set; drops aria-labelledby when not', () => {
    const titled = mount(BottomSheet, { props: { open: true, title: 'X' } })
    const titledDlg = document.querySelector('.bottom-sheet') as HTMLElement
    expect(titledDlg.getAttribute('aria-labelledby')).toBe('bottom-sheet-title')
    expect(titledDlg.getAttribute('aria-label')).toBe('X')
    titled.unmount()

    const untitled = mount(BottomSheet, {
      props: { open: true, ariaLabel: 'Pick a date' },
    })
    const dlg = document.querySelector('.bottom-sheet') as HTMLElement
    expect(dlg.getAttribute('aria-labelledby')).toBeNull()
    expect(dlg.getAttribute('aria-label')).toBe('Pick a date')
    untitled.unmount()
  })

  it('emits close on backdrop click', async () => {
    const wrapper = mount(BottomSheet, { props: { open: true } })
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('does not emit close when clicking inside the dialog', async () => {
    const wrapper = mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<div class="inner">x</div>' },
    })
    const inner = document.querySelector('.inner') as HTMLElement
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close on Escape', async () => {
    const wrapper = mount(BottomSheet, { props: { open: true } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('emits close via the header close button when title is set', async () => {
    const wrapper = mount(BottomSheet, { props: { open: true, title: 'T' } })
    const btn = document.querySelector('.bottom-sheet__close') as HTMLButtonElement
    btn.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('locks body scroll while open and restores on close', async () => {
    document.body.style.overflow = 'auto'
    const wrapper = mount(BottomSheet, { props: { open: true } })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('moves focus into the sheet on open', async () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<button class="first">first</button>' },
    })
    await flushPromises()
    // setTimeout(0) for focus move — wait one tick.
    await new Promise((r) => setTimeout(r, 0))
    const first = document.querySelector('.first') as HTMLButtonElement
    expect(document.activeElement).toBe(first)
  })

  it('focuses the dialog container when no focusable child exists', async () => {
    mount(BottomSheet, { props: { open: true }, slots: { default: '<p>just text</p>' } })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    const dlg = document.querySelector('.bottom-sheet') as HTMLElement
    expect(document.activeElement).toBe(dlg)
  })

  it('traps Tab — wraps from last focusable back to first', async () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: {
        default:
          '<button class="a">a</button><button class="b">b</button><button class="c">c</button>',
      },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))

    const last = document.querySelector('.c') as HTMLButtonElement
    last.focus()
    expect(document.activeElement).toBe(last)

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    )
    await flushPromises()

    const first = document.querySelector('.a') as HTMLButtonElement
    expect(document.activeElement).toBe(first)
  })

  it('traps Shift+Tab — wraps from first focusable to last', async () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: {
        default:
          '<button class="a">a</button><button class="b">b</button><button class="c">c</button>',
      },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))

    const first = document.querySelector('.a') as HTMLButtonElement
    first.focus()
    expect(document.activeElement).toBe(first)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()

    const last = document.querySelector('.c') as HTMLButtonElement
    expect(document.activeElement).toBe(last)
  })

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button')
    trigger.className = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const wrapper = mount(BottomSheet, { props: { open: true } })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    // Focus moved into the dialog while open.
    expect(document.activeElement).not.toBe(trigger)

    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
  })

  it('renders the drag handle bar', () => {
    mount(BottomSheet, { props: { open: true } })
    expect(document.querySelector('.bottom-sheet__handle')).not.toBeNull()
  })

  it('long content renders inside the scrollable body region', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<ul><li v-for="n in 40" :key="n">row {{n}}</li></ul>' },
    })
    const body = document.querySelector('.bottom-sheet__body') as HTMLElement
    expect(body).not.toBeNull()
    expect(body.querySelectorAll('li').length).toBe(40)
  })
})
