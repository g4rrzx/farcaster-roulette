import { NextRequest, NextResponse } from 'next/server';
import { loginFarcasterUser } from '@/services/farcaster.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fid, username, displayName, pfpUrl } = body;

        if (!fid || typeof fid !== 'number') {
            return NextResponse.json({ error: 'fid is required and must be a number' }, { status: 400 });
        }

        const user = await loginFarcasterUser(fid, username, displayName, pfpUrl);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                fid: user.fid,
                name: user.name,
                image: user.image,
                tickets: user.freeSpins,
            }
        });
    } catch (err: unknown) {
        console.error('Farcaster login error:', err);
        const message = err instanceof Error ? err.message : 'Failed to login via Farcaster';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
