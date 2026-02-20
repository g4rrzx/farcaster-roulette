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
    } catch (err: any) {
        console.error('Recent wins error:', err);
        return NextResponse.json({ error: err.message || 'Failed to get recent wins' }, { status: 500 });
    }
}
