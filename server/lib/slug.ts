import { eq } from 'drizzle-orm'
import { db } from '../db'
import { profiles } from '../db/schema/profiles'

export async function generateSlug(username: string): Promise<string> {
  const taken = await db.query.profiles.findFirst({
    where: eq(profiles.slug, username),
    columns: { id: true },
  })
  if (!taken) return username

  for (let i = 2; i <= 99; i++) {
    const candidate = `${username}${i}`
    const takenCandidate = await db.query.profiles.findFirst({
      where: eq(profiles.slug, candidate),
      columns: { id: true },
    })
    if (!takenCandidate) return candidate
  }

  return `${username}${Math.floor(1000 + Math.random() * 9000)}`
}
