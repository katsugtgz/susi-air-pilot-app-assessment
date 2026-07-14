import { describe, it, expect } from 'vitest'
import { resolveTheme, type ThemePreference, type ResolvedTheme } from './useTheme'

describe('resolveTheme', () => {
  it('returns "dark" when preference is "dark" regardless of OS', () => {
    const cases: Array<[boolean, ResolvedTheme]> = [
      [true, 'dark'],
      [false, 'dark'],
    ]
    for (const [systemDark, expected] of cases) {
      expect(resolveTheme('dark', systemDark)).toBe(expected)
    }
  })

  it('returns "light" when preference is "light" regardless of OS', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
  })

  it('defers to the OS when preference is "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('covers every ThemePreference value', () => {
    const all: ThemePreference[] = ['light', 'dark', 'system']
    for (const pref of all) {
      expect(typeof resolveTheme(pref, false)).toBe('string')
      expect(typeof resolveTheme(pref, true)).toBe('string')
    }
  })
})
