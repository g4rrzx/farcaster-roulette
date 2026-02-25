import { db } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function loginFarcasterUser(
    fid: number,
    username?: string,
    displayName?: string,
    pfpUrl?: string
) {
    // 1. Check if user already exists based on FID
    let [user] = await db.select().from(users).where(eq(users.fid, fid));

    if (!user) {
        // 2. If not, create a new user profile using BetterAuth schema requirements
        const newUser = {
            id: uuidv4(),
            name: displayName || username || `fc_user_${fid}`,
            email: `${fid}@farcaster.network`, // Dummy email to satisfy BetterAuth schema
            emailVerified: true,
            image: pfpUrl,
            fid: fid,
            walletAddress: null,
            balance: '0', // Using balance as Tickets
            level: 1,
            totalWins: 0,
            totalLosses: 0,
            totalSpins: 0,
            freeSpins: 0, // Start with 0 tickets — earn via quest board
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(users).values(newUser);

        // Fetch the newly inserted user
        [user] = await db.select().from(users).where(eq(users.fid, fid));
    } else {
        // Optional: Update their pfp/username if it changed on Farcaster
        await db
            .update(users)
            .set({
                name: displayName || username || user.name,
                image: pfpUrl || user.image,
                updatedAt: new Date()
            })
            .where(eq(users.id, user.id));

        // Refetch
        [user] = await db.select().from(users).where(eq(users.fid, fid));
    }

    return user;
}
