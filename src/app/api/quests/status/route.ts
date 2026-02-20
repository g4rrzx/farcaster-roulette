import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, questCompletions } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const fidStr = url.searchParams.get('fid');

        if (!fidStr) {
            return NextResponse.json({ error: 'fid query parameter is required' }, { status: 400 });
        }

        const fid = parseInt(fidStr, 10);
        if (isNaN(fid)) {
            return NextResponse.json({ error: 'fid must be a number' }, { status: 400 });
        }

        const [user] = await db.select().from(users).where(eq(users.fid, fid));
        if (!user) {
            return NextResponse.json({ error: 'User not found. Sign in first.' }, { status: 404 });
        }

        // We calculate "today" using UTC to ensure consistency across servers,
        // or just local server time (which Vercel forces to UTC).
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completions = await db
            .select({
                questId: questCompletions.questId
            })
            .from(questCompletions)
            .where(
                and(
                    eq(questCompletions.userId, user.id),
                    sql`${questCompletions.completedAt} >= ${today.toISOString()}`
                )
            );

        // Map database IDs to string keys
        const questIdMap: Record<number, string> = { 1: 'daily', 2: 'follow', 3: 'recast' };

        const statuses = {
            daily: 'idle',
            follow: 'idle',
            recast: 'idle'
        };

        completions.forEach(c => {
            const key = questIdMap[c.questId];
            if (key) {
                // @ts-ignore
                statuses[key] = 'claimed';
            }
        });

        // Calculate next claim date (Next midnight UTC/server time)
        const nextClaim = new Date(today);
        nextClaim.setDate(today.getDate() + 1);

        return NextResponse.json({
            success: true,
            quests: statuses,
            nextClaimDate: nextClaim.toISOString()
        });

    } catch (err: unknown) {
        console.error('Quest status error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch status';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
