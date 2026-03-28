import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { user } from './auth'

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  reporterUserId: text('reporter_user_id').references(() => user.id, { onDelete: 'set null' }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
