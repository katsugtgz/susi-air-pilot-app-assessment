import { describe, it, expect } from 'vitest'
import { resolveAuthRedirect } from './resolveAuthRedirect'

describe('resolveAuthRedirect', () => {
  it('sends unauthenticated visitors on a protected route back to /', () => {
    expect(resolveAuthRedirect(false, '/home')).toBe('/')
    expect(resolveAuthRedirect(false, '/schedule')).toBe('/')
    expect(resolveAuthRedirect(false, '/logbook')).toBe('/')
    expect(resolveAuthRedirect(false, '/more')).toBe('/')
  })

  it('lets unauthenticated visitors stay on / (Sign In)', () => {
    expect(resolveAuthRedirect(false, '/')).toBeNull()
  })

  it('bounces authenticated visitors away from / to /home', () => {
    expect(resolveAuthRedirect(true, '/')).toBe('/home')
  })

  it('lets authenticated visitors through to app routes', () => {
    expect(resolveAuthRedirect(true, '/home')).toBeNull()
    expect(resolveAuthRedirect(true, '/schedule')).toBeNull()
    expect(resolveAuthRedirect(true, '/logbook')).toBeNull()
    expect(resolveAuthRedirect(true, '/more')).toBeNull()
  })

  it('treats only / as special for authed users; other unknown paths pass', () => {
    expect(resolveAuthRedirect(true, '/nonexistent')).toBeNull()
  })

  it('still protects unknown paths when signed out', () => {
    expect(resolveAuthRedirect(false, '/nonexistent')).toBe('/')
  })
})
