import { describe, expect, it } from 'vitest'

import {
  getStorageBucketConfig,
  isPublicStorageBucket,
  storageBucketConfig,
  storageBucketIds,
  storageBucketSchema,
} from '@/lib/storage/buckets'

describe('storage bucket configuration', () => {
  it('defines the expected bucket ids', () => {
    expect(storageBucketIds).toEqual([
      'guide-avatars',
      'guide-documents',
      'listing-media',
      'dispute-evidence',
    ])
  })

  it('exposes the expected public/private bucket flags', () => {
    expect(isPublicStorageBucket('guide-avatars')).toBe(true)
    expect(isPublicStorageBucket('listing-media')).toBe(true)
    expect(isPublicStorageBucket('guide-documents')).toBe(false)
    expect(isPublicStorageBucket('dispute-evidence')).toBe(false)
  })

  it('enforces the documented file size limits', () => {
    expect(getStorageBucketConfig('guide-avatars').maxBytes).toBe(2 * 1024 * 1024)
    expect(getStorageBucketConfig('listing-media').maxBytes).toBe(5 * 1024 * 1024)
    expect(getStorageBucketConfig('guide-documents').maxBytes).toBe(10 * 1024 * 1024)
    expect(getStorageBucketConfig('dispute-evidence').maxBytes).toBe(10 * 1024 * 1024)
  })

  it('allows only image MIME types for public image buckets', () => {
    expect(storageBucketConfig['guide-avatars'].allowedMimeTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    expect(storageBucketConfig['listing-media'].allowedMimeTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    expect(storageBucketConfig['guide-avatars'].allowedMimeTypes).not.toContain('application/pdf')
    expect(storageBucketConfig['listing-media'].allowedMimeTypes).not.toContain('application/pdf')
  })

  it('allows PDFs only in private document/evidence buckets', () => {
    expect(storageBucketConfig['guide-documents'].allowedMimeTypes).toContain('application/pdf')
    expect(storageBucketConfig['dispute-evidence'].allowedMimeTypes).toContain('application/pdf')
  })

  it('validates bucket ids via schema', () => {
    expect(storageBucketSchema.parse('guide-documents')).toBe('guide-documents')
    expect(() => storageBucketSchema.parse('unknown-bucket')).toThrow()
  })
})
