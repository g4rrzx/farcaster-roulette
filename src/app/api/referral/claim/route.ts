import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, referrals } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { referrerFid, referredFid } = body;

        if (!referrerFid || !referredFid) {
            return NextResponse.json({ error: 'referrerFid and referredFid are required' }, { status: 400 });
        }

        const refFid = parseInt(referrerFid, 10);
        const myFid = parseInt(referredFid, 10);

        if (isNaN(refFid) || isNaN(myFid)) {
            return NextResponse.json({ error: 'FIDs must be numbers' }, { status: 400 });
        }

        if (refFid === myFid) {
            return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 });
        }

        // We use a transaction to ensure all updates happen together
        return await db.transaction(async (tx) => {
            // Check if referred user already claimed a referral
            const [existingReferral] = await tx.select().from(referrals).where(eq(referrals.referredFid, myFid));
            if (existingReferral) {
                return NextResponse.json({ error: 'You have already used a referral code' }, { status: 400 });
            }

            // Check if referrer exists
            const [referrer] = await tx.select().from(users).where(eq(users.fid, refFid));
            if (!referrer) {
                return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
            }

            // Check if referred user exists
            const [referred] = await tx.select().from(users).where(eq(users.fid, myFid));
            if (!referred) {
                return NextResponse.json({ error: 'Your user profile was not found' }, { status: 404 });
            }

            // Insert referral record
            await tx.insert(referrals).values({
                referrerFid: refFid,
                referredFid: myFid,
            });

            // Update referrer (add 2 free spins)
            await tx.update(users)
                .set({ freeSpins: sql`${users.freeSpins} + 2` })
                .where(eq(users.fid, refFid));

            // Update referred (add 1 free spin)
            await tx.update(users)
                .set({ freeSpins: sql`${users.freeSpins} + 1` })
                .where(eq(users.fid, myFid));

            return NextResponse.json({ success: true, message: 'Referral claimed successfully! You got 1 free spin.' });
        });
    } catch (err: unknown) {
        console.error('Referral claim error:', err);
        const message = err instanceof Error ? err.message : 'Failed to process referral';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
