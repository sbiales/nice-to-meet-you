import { pgTable, uuid, text, boolean, integer } from 'drizzle-orm/pg-core'
import { pgEnum } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const socialPlatformEnum = pgEnum('social_platform', [
  'instagram',
  'spotify',
  'linkedin',
  'twitter',
  'tiktok',
  'youtube',
  'website',
  'other',
])

export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  platform: socialPlatformEnum('platform').notNull(),
  url: text('url').notNull(),
  isVisible: boolean('is_visible').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})
