import { describe, it, expect } from 'vitest'

function shouldBeExpired(startsOn: string, today: string): boolean {
  return new Date(startsOn) < new Date(today)
}

describe('request expiry logic', () => {
  it('expires a request whose start date is yesterday', () => {
    expect(shouldBeExpired('2026-04-20', '2026-04-21')).toBe(true)
  })

  it('does not expire a request starting today', () => {
    expect(shouldBeExpired('2026-04-21', '2026-04-21')).toBe(false)
  })

  it('does not expire a future request', () => {
    expect(shouldBeExpired('2026-05-01', '2026-04-21')).toBe(false)
  })
})
