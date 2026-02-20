import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Bearer token representing Farcaster FID required' }, { status: 401 });
        }

        const fidValue = parseInt(authHeader.split(' ')[1], 10);
        if (isNaN(fidValue)) {
            return NextResponse.json({ error: 'Unauthorized: Invalid FID' }, { status: 401 });
        }

        const [user] = await db.select().from(users).where(eq(users.fid, fidValue));
        if (!user) {
            return NextResponse.json({ error: 'User not found in database. Sign in first.' }, { status: 404 });
        }

        const [updatedUser] = await db
            .update(users)
            .set({
                freeSpins: sql`${users.freeSpins} + 1`,
                updatedAt: new Date()
            })
            .where(eq(users.id, user.id))
            .returning({ tickets: users.freeSpins });

        return NextResponse.json({ success: true, tickets: updatedUser.tickets });
    } catch (err: unknown) {
        console.error('Claim ticket error:', err);
        const message = err instanceof Error ? err.message : 'Failed to claim ticket';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
