import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySpinTransaction } from '@/services/spin.service';

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

        const body = await req.json();
        const { txHash } = body;

        if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
            return NextResponse.json({ error: 'A valid transaction hash (txHash) is required' }, { status: 400 });
        }

        const result = await verifySpinTransaction(user.id, txHash);
        return NextResponse.json(result);
    } catch (err: any) {
        console.error('Spin verification error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Verification failed' }, { status: 500 });
    }
}
