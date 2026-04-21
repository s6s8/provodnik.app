import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TravelerRequestStatusBadge } from './traveler-request-status'

describe('TravelerRequestStatusBadge', () => {
  it('renders open status with blue styling', () => {
    render(<TravelerRequestStatusBadge status="open" />)
    const badge = screen.getByText('Ожидает')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100')
  })

  it('renders booked status with emerald styling', () => {
    render(<TravelerRequestStatusBadge status="booked" />)
    const badge = screen.getByText('Забронировано')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-emerald-100')
  })

  it('renders expired status with red styling', () => {
    render(<TravelerRequestStatusBadge status="expired" />)
    const badge = screen.getByText('Истёк')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
  })

  it('renders cancelled status with red styling', () => {
    render(<TravelerRequestStatusBadge status="cancelled" />)
    const badge = screen.getByText('Отменён')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
  })

  it('renders offers_received status with amber styling', () => {
    render(<TravelerRequestStatusBadge status="offers_received" />)
    const badge = screen.getByText('Есть предложения')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-amber-100')
  })

  it('renders draft with outline dashed styling', () => {
    render(<TravelerRequestStatusBadge status="draft" />)
    const badge = screen.getByText('Черновик')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('border-dashed')
  })

  it('renders unknown status with fallback gray styling', () => {
    render(<TravelerRequestStatusBadge status="whatever" />)
    const badge = screen.getByText('whatever')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
  })
})
