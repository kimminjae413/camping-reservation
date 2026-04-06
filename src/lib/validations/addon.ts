import { z } from 'zod'

export const addonSchema = z.object({
  name: z.string().min(1, '부대시설명을 입력해주세요').max(100),
  description: z.string().min(1, '설명을 입력해주세요'),
  photoKey: z.string().optional(),
  price: z.number().int().min(0, '금액은 0원 이상이어야 합니다'),
  priceType: z.enum(['PER_BOOKING', 'PER_PERSON', 'PER_NIGHT']),
  maxDailyQty: z.number().int().min(1, '최소 1개 이상이어야 합니다'),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type AddonFormData = z.infer<typeof addonSchema>
