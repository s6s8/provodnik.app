import { describe, it, expect } from 'vitest'
import { maskPii } from '@/lib/pii/mask'

describe('maskPii contract', () => {
  it('masks a Russian phone number with +7', () => {
    expect(maskPii('Позвони +7 (999) 123-45-67')).toContain('[контакт скрыт]')
  })

  it('masks a Russian phone starting with 8', () => {
    expect(maskPii('тел 89001234567')).toContain('[контакт скрыт]')
  })

  it('masks an email address', () => {
    expect(maskPii('guide@example.com')).toContain('[контакт скрыт]')
  })

  it('masks a telegram @handle', () => {
    expect(maskPii('мой телеграм @ivanov_guide')).toContain('[контакт скрыт]')
  })

  it('masks t.me link', () => {
    expect(maskPii('пиши t.me/myguide')).toContain('[контакт скрыт]')
  })

  it('does NOT mask the word телеграм without handle', () => {
    const text = 'нет связи как в телеграме'
    expect(maskPii(text)).toBe(text)
  })

  it('does NOT mask a price like 8 000 рублей', () => {
    const text = 'Цена 8 000 рублей за группу'
    expect(maskPii(text)).toBe(text)
  })

  it('returns empty string for null', () => {
    expect(maskPii(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(maskPii(undefined)).toBe('')
  })
})

describe('getOffersForRequest masks message field', () => {
  it('maskPii removes phone from offer message', () => {
    const rawMessage = 'Звоните +79001234567 в любое время'
    const masked = maskPii(rawMessage)
    expect(masked).not.toContain('+79001234567')
    expect(masked).toContain('[контакт скрыт]')
  })

  it('maskPii removes email from offer message', () => {
    const rawMessage = 'Пишите guide@mail.ru'
    const masked = maskPii(rawMessage)
    expect(masked).not.toContain('guide@mail.ru')
    expect(masked).toContain('[контакт скрыт]')
  })
})
