import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { notificationTokens } from '@/db/schema';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { secret, title, message } = body;

        // Simple protection for the admin endpoint
        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!title || !message) {
            return NextResponse.json({ success: false, error: 'Title and message required' }, { status: 400 });
        }

        // Fetch all tokens
        const tokens = await db.select().from(notificationTokens);
        if (tokens.length === 0) {
            return NextResponse.json({ success: true, message: 'No users to notify' });
        }

        // Farcaster requires grouping by URL 
        // (Warpcast currently uses a standard URL, but it's best to group just in case)
        const batchesByUrl: Record<string, string[]> = {};

        for (const user of tokens) {
            if (!batchesByUrl[user.url]) {
                batchesByUrl[user.url] = [];
            }
            batchesByUrl[user.url].push(user.token);
        }

        let sentCount = 0;
        let errorCount = 0;

        // Send notifications
        // Farcaster allows batching up to 100 requests, our loop handles that per URL
        for (const [url, tokens] of Object.entries(batchesByUrl)) {
            // Chunk tokens into batches of 100
            for (let i = 0; i < tokens.length; i += 100) {
                const batch = tokens.slice(i, i + 100);

                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            notificationId: crypto.randomUUID(), // Stable ID per batch
                            title,
                            body: message,
                            targetUrl: 'https://rouletee.vercel.app',
                            tokens: batch,
                        }),
                    });

                    if (res.ok) {
                        sentCount += batch.length;
                    } else {
                        console.error('Failed to send batch to', url, await res.text());
                        errorCount += batch.length;
                    }
                } catch (e) {
                    console.error('Error sending batch to', url, e);
                    errorCount += batch.length;
                }
            }
        }

        return NextResponse.json({
            success: true,
            sent: sentCount,
            errors: errorCount
        });

    } catch (err: unknown) {
        console.error('Notify route error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
