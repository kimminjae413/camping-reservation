import { z } from 'zod'

export const AMENITY_OPTIONS = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'ac', label: '에어컨' },
  { value: 'restroom', label: '화장실' },
  { value: 'tv', label: 'TV' },
  { value: 'kitchen', label: '취사시설' },
  { value: 'electricity', label: '전기' },
  { value: 'hotwater', label: '온수' },
  { value: 'bbq', label: '바베큐장' },
  { value: 'parking', label: '주차' },
  { value: 'pet', label: '반려동물 가능' },
] as const

export type AmenityValue = typeof AMENITY_OPTIONS[number]['value']

export const siteTypeSchema = z.object({
  name: z.string().min(1, '객실명을 입력해주세요').max(100),
  description: z.string().min(1, '설명을 입력해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  baseCapacity: z.number().int().min(1).max(50),
  maxCapacity: z.number().int().min(1).max(50),
  amenities: z.array(z.string()).default([]),
  photoKeys: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

export type SiteTypeFormData = z.infer<typeof siteTypeSchema>
