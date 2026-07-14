import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CopilotBubble from './CopilotBubble.vue'

// happy-dom doesn't expose localStorage unless launched with
// --localstorage-file; provide a minimal in-memory polyfill so the
// bubble's persist/load logic is exercised under vitest.
const memStore = new Map<string, string>()
const localStorageStub = {
  getItem: (key: string) => memStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memStore.set(key, value)
  },
  removeItem: (key: string) => {
    memStore.delete(key)
  },
  clear: () => {
    memStore.clear()
  },
  key: (i: number) => Array.from(memStore.keys())[i] ?? null,
  get length() {
    return memStore.size
  },
}

const setViewport = (w = 390, h = 844) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: h })
}

beforeEach(() => {
  setViewport()
  memStore.clear()
  vi.stubGlobal('localStorage', localStorageStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('CopilotBubble', () => {
  it('renders a button with the correct aria-label', async () => {
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement
    expect(btn).not.toBeNull()
    expect(btn.getAttribute('aria-label')).toBe('Open AI copilot')
  })

  it('emits open + opens the sheet on tap (no move beyond threshold)', async () => {
    const wrapper = mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 400, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 400, bubbles: true }))

    await flushPromises()
    expect(wrapper.emitted('open')).toBeDefined()
    // The CopilotSheet inside should be rendered (teleported to body).
    expect(document.querySelector('.copilot-sheet')).not.toBeNull()
  })

  it('does NOT emit open when dragged beyond the threshold', async () => {
    const wrapper = mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 400, bubbles: true }))
    // Move well beyond the 6px threshold.
    btn.dispatchEvent(new PointerEvent('pointermove', { clientX: 140, clientY: 420, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointerup', { clientX: 140, clientY: 420, bubbles: true }))

    await flushPromises()
    expect(wrapper.emitted('open')).toBeUndefined()
    // Drag should not open the sheet.
    expect(document.querySelector('.copilot-sheet')).toBeNull()
  })

  it('persists position to localStorage after a drag', async () => {
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 400, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointermove', { clientX: 140, clientY: 420, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointerup', { clientX: 140, clientY: 420, bubbles: true }))
    await flushPromises()

    const stored = window.localStorage.getItem('copilot-bubble-pos')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!) as { x: number; y: number }
    expect(typeof parsed.x).toBe('number')
    expect(typeof parsed.y).toBe('number')
  })

  it('snaps to a viewport edge on drag end', async () => {
    setViewport(390, 844)
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement

    // Start near the middle, drag slightly right → should snap to right edge.
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 400, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointermove', { clientX: 210, clientY: 400, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointerup', { clientX: 210, clientY: 400, bubbles: true }))
    await flushPromises()

    const stored = JSON.parse(window.localStorage.getItem('copilot-bubble-pos')!) as { x: number; y: number }
    // Snapped right edge: vw - bubbleSize - margin = 390 - 56 - 16 = 318
    expect(stored.x).toBe(390 - 56 - 16)
  })

  it('loads position from localStorage on mount', async () => {
    window.localStorage.setItem('copilot-bubble-pos', JSON.stringify({ x: 32, y: 100 }))
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLElement
    const style = btn.getAttribute('style') ?? ''
    expect(style).toContain('left: 32px')
    expect(style).toContain('top: 100px')
  })

  it('clamps a loaded position back into the viewport', async () => {
    setViewport(200, 200) // tiny viewport
    window.localStorage.setItem('copilot-bubble-pos', JSON.stringify({ x: 5000, y: 5000 }))
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLElement
    const style = btn.getAttribute('style') ?? ''
    // Max x = 200 - 56 - 16 = 128; max y reserves 72px for bottom nav.
    expect(style).toContain('left: 128px')
    // y is clamped but exact value depends on safe-area which is 0 in happy-dom.
    expect(style).not.toContain('top: 5000px')
  })

  it('keeps the bubble visible (initialized) after mount', async () => {
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLElement
    // v-show toggles display; initialized=true after onMounted.
    expect(btn.style.display).not.toBe('none')
  })

  it('closes the sheet when the close event fires', async () => {
    mount(CopilotBubble, { attachTo: document.body })
    await flushPromises()
    const btn = document.querySelector('.copilot-bubble') as HTMLButtonElement

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 400, bubbles: true }))
    btn.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 400, bubbles: true }))
    await flushPromises()
    expect(document.querySelector('.copilot-sheet')).not.toBeNull()

    // Find the close button inside the teleported sheet.
    const closeBtn = document.querySelector('.copilot-sheet__close') as HTMLButtonElement
    closeBtn.click()
    await flushPromises()
    // Sheet leaves via Transition; we expect it to be removed after the leave.
    // flushPromises may not flush the transition, so check the v-if state via
    // the root having no .copilot-sheet child after a tick.
    // Allow up to a short wait by re-flushing.
    await new Promise((r) => setTimeout(r, 0))
    expect(document.querySelector('.copilot-sheet')).toBeNull()
  })
})
