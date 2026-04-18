// server/api/contact/[username].post.ts
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { profiles } from '../../db/schema/profiles'
import { user } from '../../db/schema/auth'
import { contactMessages } from '../../db/schema/contact-messages'
import { sendEmail } from '../../lib/email'
import { checkRateLimit } from '../../utils/rate-limit'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!checkRateLimit(ip)) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
  }

  const username = getRouterParam(event, 'username')
  if (!username) {
    throw createError({ statusCode: 400, message: 'Username required' })
  }

  const body = await readBody(event)
  const { name, email, message } = body ?? {}

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (!message?.trim()) throw createError({ statusCode: 400, message: 'Message is required' })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address' })
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })

  if (!profile || profile.deletedAt) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }
  if (profile.status !== 'active' || !profile.isContactable) {
    throw createError({ statusCode: 403, message: 'This profile is not accepting messages' })
  }

  await db.insert(contactMessages).values({
    profileId: profile.id,
    senderName: name.trim(),
    senderEmail: email?.trim() || null,
    message: message.trim(),
  })

  const ownerRows = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, profile.userId))
    .limit(1)
  const ownerEmail = ownerRows[0]?.email

  if (ownerEmail) {
    const safeName = escapeHtml(name.trim())
    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br>')
    const replyLine = email
      ? `<p>Reply to: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`
      : `<p><em>No email provided — they did not include contact details.</em></p>`

    await sendEmail({
      to: ownerEmail,
      subject: `New message from ${name.trim()} on Nice To Meet You`,
      html: `
        <p><strong>${safeName}</strong> sent you a message:</p>
        <blockquote style="border-left:3px solid #ccc;padding-left:1em;margin:1em 0">
          ${safeMessage}
        </blockquote>
        ${replyLine}
      `,
    })
  }

  return { success: true }
})
