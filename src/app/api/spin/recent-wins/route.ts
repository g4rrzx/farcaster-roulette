import { NextRequest, NextResponse } from 'next/server';
import { getRecentWins } from '@/services/spin.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limitStr = url.searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 10;

        const recentWins = await getRecentWins(limit);
        return NextResponse.json(recentWins);
    } catch (err: unknown) {
        console.error('Recent wins error:', err);
        const message = err instanceof Error ? err.message : 'Failed to get recent wins';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
