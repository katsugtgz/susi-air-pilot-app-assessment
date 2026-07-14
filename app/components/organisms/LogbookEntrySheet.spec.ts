import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LogbookEntrySheet from './LogbookEntrySheet.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function mountSheet(open = true) {
  return mount(LogbookEntrySheet, {
    props: { open, defaultDate: '2026-05-15' },
  })
}

function setInput(name: string, value: string): void {
  const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function clickSave(): Promise<void> {
  const footer = document.querySelector('.bottom-sheet__footer') as HTMLElement
  const save = footer.querySelector('button.base-button--primary') as HTMLButtonElement
  save.click()
  await flushPromises()
}

describe('LogbookEntrySheet', () => {
  it('renders nothing when closed', () => {
    mountSheet(false)
    expect(document.querySelector('.entry-form')).toBeNull()
  })

  it('renders the form with title "Log flight"', () => {
    mountSheet()
    expect(document.querySelector('.bottom-sheet__title')?.textContent?.trim()).toBe('Log flight')
    expect(document.querySelector('input[name="date"]')).not.toBeNull()
    expect(document.querySelector('input[name="from"]')).not.toBeNull()
    expect(document.querySelector('input[name="to"]')).not.toBeNull()
    expect(document.querySelector('input[name="aircraft"]')).not.toBeNull()
    expect(document.querySelector('input[name="blockTime"]')).not.toBeNull()
    expect(document.querySelector('input[name="remarks"]')).not.toBeNull()
  })

  it('defaults the date to the mock today prop, never the system date', () => {
    mount(LogbookEntrySheet, { props: { open: true, defaultDate: '2026-05-15' } })
    const date = document.querySelector('input[name="date"]') as HTMLInputElement
    expect(date.value).toBe('2026-05-15')
  })

  it('prefills the aircraft field with the standard Caravan string', () => {
    mountSheet()
    const aircraft = document.querySelector('input[name="aircraft"]') as HTMLInputElement
    expect(aircraft.value).toBe('PK-BVM · C208B Grand Caravan')
  })

  it('uppercases from/to as the user types', async () => {
    mountSheet()
    setInput('from', 'pdg')
    setInput('to', 'rsk')
    await flushPromises()
    const from = document.querySelector('input[name="from"]') as HTMLInputElement
    const to = document.querySelector('input[name="to"]') as HTMLInputElement
    expect(from.value).toBe('PDG')
    expect(to.value).toBe('RSK')
  })

  it('shows validation errors and does NOT emit submit when fields are invalid', async () => {
    const wrapper = mountSheet()
    // Leave from/to/blockTime empty; date + aircraft are prefilled valid.
    setInput('from', '')
    await flushPromises()
    await clickSave()
    const errors = document.querySelectorAll('.base-input__error')
    expect(errors.length).toBeGreaterThan(0)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('rejects a malformed block time (H:mm)', async () => {
    mountSheet()
    setInput('from', 'PDG')
    setInput('to', 'RSK')
    setInput('blockTime', '90')
    await flushPromises()
    await clickSave()
    const blockErr = Array.from(document.querySelectorAll('.base-input__error')).find((e) =>
      e.textContent?.includes('H:mm'),
    )
    expect(blockErr).toBeTruthy()
  })

  it('rejects a non-3-letter airport code', async () => {
    const wrapper = mountSheet()
    setInput('from', 'PD')
    setInput('to', 'RSK')
    setInput('blockTime', '1:30')
    await flushPromises()
    await clickSave()
    expect(wrapper.emitted('submit')).toBeUndefined()
    const fromErr = Array.from(document.querySelectorAll('.base-input__error')).some((e) =>
      e.textContent?.includes('3-letter'),
    )
    expect(fromErr).toBe(true)
  })

  it('emits submit with the typed payload on a valid form', async () => {
    const wrapper = mountSheet()
    setInput('from', 'pdg')
    setInput('to', 'rsk')
    setInput('blockTime', '1:30')
    setInput('remarks', 'Smooth sector')
    await flushPromises()
    await clickSave()
    const events = wrapper.emitted('submit')
    expect(events).toBeDefined()
    expect(events).toHaveLength(1)
    const payload = events?.[0]?.[0] as {
      date: string
      from: string
      to: string
      aircraft: string
      blockTime: string
      remarks?: string
    }
    expect(payload.date).toBe('2026-05-15')
    expect(payload.from).toBe('PDG')
    expect(payload.to).toBe('RSK')
    expect(payload.aircraft).toBe('PK-BVM · C208B Grand Caravan')
    expect(payload.blockTime).toBe('1:30')
    expect(payload.remarks).toBe('Smooth sector')
  })

  it('omits remarks from the payload when left blank', async () => {
    const wrapper = mountSheet()
    setInput('from', 'PDG')
    setInput('to', 'RSK')
    setInput('blockTime', '0:45')
    await flushPromises()
    await clickSave()
    const payload = wrapper.emitted('submit')?.[0]?.[0] as { remarks?: string }
    expect(payload.remarks).toBeUndefined()
  })

  it('emits close on the Cancel button', async () => {
    const wrapper = mountSheet()
    const footer = document.querySelector('.bottom-sheet__footer') as HTMLElement
    const cancel = footer.querySelector('button.base-button--secondary') as HTMLButtonElement
    cancel.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('emits close on backdrop click', async () => {
    const wrapper = mountSheet()
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('resets the form to defaults when reopened', async () => {
    const wrapper = mountSheet()
    setInput('from', 'PDG')
    setInput('blockTime', '1:30')
    await flushPromises()
    await wrapper.setProps({ open: false })
    await flushPromises()
    await wrapper.setProps({ open: true })
    await flushPromises()
    const from = document.querySelector('input[name="from"]') as HTMLInputElement
    const blockTime = document.querySelector('input[name="blockTime"]') as HTMLInputElement
    expect(from.value).toBe('')
    expect(blockTime.value).toBe('')
    expect((document.querySelector('input[name="date"]') as HTMLInputElement).value).toBe('2026-05-15')
  })
})
