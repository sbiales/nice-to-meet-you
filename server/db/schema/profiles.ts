import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'
import { pgEnum } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const profileStatusEnum = pgEnum('profile_status', ['active', 'taken', 'paused'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  status: profileStatusEnum('status').notNull().default('active'),
  headerImageKey: text('header_image_key'),
  theme: jsonb('theme').notNull().default({}),
  blocks: jsonb('blocks').notNull().default([]),
  isContactable: boolean('is_contactable').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
