import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, spins, referrals } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

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
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch recent spin history
        const history = await db
            .select({
                id: spins.id,
                result: spins.result,
                payout: spins.payout,
                createdAt: spins.createdAt,
            })
            .from(spins)
            .where(eq(spins.userId, user.id))
            .orderBy(sql`${spins.createdAt} DESC`)
            .limit(20);
        // Check if user has already claimed a referral
        const [referralCheck] = await db
            .select({ id: referrals.id })
            .from(referrals)
            .where(eq(referrals.referredFid, fid))
            .limit(1);

        return NextResponse.json({
            user: {
                name: user.name,
                image: user.image,
                fid: user.fid,
                walletAddress: user.walletAddress,
            },
            stats: {
                totalWins: user.totalWins,
                totalSpins: user.totalSpins,
                totalLosses: user.totalLosses,
                balance: Number(user.balance),
                tickets: user.freeSpins,
            },
            hasClaimedReferral: !!referralCheck,
            history: history.map(h => ({
                id: h.id,
                type: h.result === 'loss' ? 'loss' : 'win',
                amount: h.result === 'loss' ? '-1 🎟️' : `+${h.payout} ARB`,
                time: h.createdAt ? new Date(h.createdAt).toLocaleString() : '',
            })),
        });
    } catch (err: unknown) {
        console.error('Profile fetch error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch profile';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
