import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { prepareSpin } from '@/services/spin.service';

export async function POST(req: NextRequest) {
    try {
        // Authenticate the FID bypassing express standard middleware
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
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Handle body inputs
        const body = await req.json();
        const { userWallet, nonce } = body;

        if (!userWallet || typeof userWallet !== 'string') {
            return NextResponse.json({ error: 'userWallet is required and must be a string' }, { status: 400 });
        }

        if (nonce === undefined || typeof nonce !== 'number') {
            return NextResponse.json({ error: 'nonce is required and must be a number' }, { status: 400 });
        }

        const payload = await prepareSpin(user.id, userWallet, nonce);
        return NextResponse.json({ success: true, ...payload });

    } catch (err: any) {
        const message = err.message || 'Signature generation failed';
        const statusCode = message.includes('Insufficient') ? 400 : 500;
        return NextResponse.json({ success: false, error: message }, { status: statusCode });
    }
}
