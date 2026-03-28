import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  senderName: text('sender_name'),
  senderEmail: text('sender_email'),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
})
