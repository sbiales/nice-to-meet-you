import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
