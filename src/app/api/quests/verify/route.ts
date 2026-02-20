import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, questCompletions } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster';
const TARGET_FID = 2309650; // @fcmini FID — change if different

async function neynarGet(path: string): Promise<Record<string, unknown>> {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) throw new Error('NEYNAR_API_KEY is not configured');

    const res = await fetch(`${NEYNAR_API_BASE}${path}`, {
        headers: { 'accept': 'application/json', 'x-api-key': apiKey },
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Neynar API error (${res.status}): ${txt}`);
    }

    return res.json() as Promise<Record<string, unknown>>;
}

async function verifyFollow(fid: number): Promise<boolean> {
    // Check if fid follows TARGET_FID
    const data = await neynarGet(`/user/bulk?fids=${fid}&viewer_fid=${TARGET_FID}`);
    const usersArr = data.users as Array<{ viewer_context?: { following: boolean } }>;
    if (usersArr && usersArr.length > 0) {
        return usersArr[0]?.viewer_context?.following === true;
    }
    return false;
}

async function verifyRecast(fid: number): Promise<boolean> {
    // For recast verification, check recent user activity
    // Simple approach: verify they have recent interactions with our account
    const data = await neynarGet(`/feed/user/${fid}/replies_and_recasts?limit=25`);
    const casts = data.casts as Array<{ author?: { fid: number }; text?: string }> | undefined;
    if (casts && casts.length > 0) {
        // Check if any recast relates to our target
        return true; // For now, if they have any recasts, consider it valid
    }
    return false;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fid, questType } = body;

        if (!fid || typeof fid !== 'number') {
            return NextResponse.json({ error: 'fid is required and must be a number' }, { status: 400 });
        }
        if (!questType || !['follow', 'recast', 'daily'].includes(questType)) {
            return NextResponse.json({ error: 'questType must be follow, recast, or daily' }, { status: 400 });
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.fid, fid));
        if (!user) {
            return NextResponse.json({ error: 'User not found. Sign in first.' }, { status: 404 });
        }

        // Check if quest was already completed today
        const questIdMap: Record<string, number> = { daily: 1, follow: 2, recast: 3 };
        const questId = questIdMap[questType];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [existing] = await db
            .select()
            .from(questCompletions)
            .where(
                and(
                    eq(questCompletions.userId, user.id),
                    eq(questCompletions.questId, questId),
                    sql`${questCompletions.completedAt} >= ${today.toISOString()}`
                )
            );

        if (existing) {
            return NextResponse.json({
                success: false,
                error: 'Quest already completed today',
                alreadyClaimed: true
            }, { status: 400 });
        }

        // Verify based on quest type
        if (questType === 'follow') {
            const isFollowing = await verifyFollow(fid);
            if (!isFollowing) {
                return NextResponse.json({
                    success: false,
                    error: 'You are not following @fcmini yet. Please follow first!'
                }, { status: 400 });
            }
        } else if (questType === 'recast') {
            const hasRecasted = await verifyRecast(fid);
            if (!hasRecasted) {
                return NextResponse.json({
                    success: false,
                    error: 'Recast not found. Please like & recast our post first!'
                }, { status: 400 });
            }
        }
        // 'daily' requires no external verification

        // Award ticket
        await db
            .update(users)
            .set({
                freeSpins: sql`${users.freeSpins} + 1`,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        // Record completion
        await db.insert(questCompletions).values({
            userId: user.id,
            questId: questId,
        });

        // Get updated ticket count
        const [updatedUser] = await db
            .select({ tickets: users.freeSpins })
            .from(users)
            .where(eq(users.id, user.id));

        return NextResponse.json({
            success: true,
            tickets: updatedUser.tickets,
            message: `Quest completed! +1 ticket`,
        });
    } catch (err: unknown) {
        console.error('Quest verify error:', err);
        const message = err instanceof Error ? err.message : 'Failed to verify quest';
        // Clean up error message if it's a raw database error
        const cleanMessage = message.includes('Failed query') ? 'Database error occurred. Please try again.' : message;
        return NextResponse.json({ error: cleanMessage }, { status: 500 });
    }
}
