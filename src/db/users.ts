import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateUserTier(userId: number, tier: string) {
  try {
    const result = await db.update(users)
      .set({ tier })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to update user tier:", error);
    throw new Error("Failed to update user tier", { cause: error });
  }
}
