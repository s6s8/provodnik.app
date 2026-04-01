import { describe, expect, it } from 'vitest'

import { createRequestInputSchema } from '@/lib/supabase/requests'

describe('createRequestInputSchema', () => {
  it('accepts valid input and applies defaults', () => {
    const parsed = createRequestInputSchema.parse({
      destination: '  Москва  ',
      category: 'culture',
      starts_on: '2026-05-10',
      ends_on: '2026-05-12',
      budget_minor: 150000,
      notes: '  Нужен гид со знанием истории.  ',
      region: '  Центральный  ',
    })

    expect(parsed).toMatchObject({
      destination: 'Москва',
      category: 'culture',
      starts_on: '2026-05-10',
      ends_on: '2026-05-12',
      budget_minor: 150000,
      participants_count: 1,
      open_to_join: false,
      allow_guide_suggestions: true,
      notes: 'Нужен гид со знанием истории.',
      region: 'Центральный',
    })
  })

  it('rejects an invalid date range with the expected message', () => {
    const result = createRequestInputSchema.safeParse({
      destination: 'Казань',
      category: 'food',
      starts_on: '2026-06-03',
      ends_on: '2026-06-01',
      participants_count: 2,
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected schema validation to fail')
    }

    expect(result.error.flatten().fieldErrors.ends_on).toContain(
      'Дата окончания должна быть не раньше даты начала.',
    )
  })

  it('rejects invalid field values with the expected messages', () => {
    const result = createRequestInputSchema.safeParse({
      destination: 'A',
      category: 'city',
      starts_on: 'bad-date',
      ends_on: '',
      budget_minor: 999,
      participants_count: 0,
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected schema validation to fail')
    }

    const fieldErrors = result.error.flatten().fieldErrors

    expect(fieldErrors.destination).toContain('Укажите направление (минимум 2 символа).')
    expect(fieldErrors.starts_on).toContain('Дата начала указана неверно.')
    expect(fieldErrors.ends_on).toContain('Укажите дату окончания.')
    expect(fieldErrors.budget_minor).toContain('Бюджет должен быть не менее 1 000 ₽.')
    expect(fieldErrors.participants_count).toContain('Минимум 1 путешественник.')
  })
})
