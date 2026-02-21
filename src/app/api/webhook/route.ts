import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { notificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Ensure we have a valid payload
        if (!body || !body.event) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        const { event, notificationDetails } = body;

        // Note: For production with Neynar, we need to verify the webhook signature here.
        // The @farcaster/miniapp-node library or Neynar SDK would be used here dynamically.
        // For right now, we trust the payload if it's well-formed to get it working in the mini app.

        // We can optionally verify the fid from a signed header or context if needed, 
        // but for now let's assume the Farcaster Client (Warpcast) is sending trusted requests 
        // (Wait: Actually the incoming payload needs to provide the FID. Mini app webhooks from Warpcast 
        // are documented to be verified using `@farcaster/miniapp-node`. Without it, we don't naturally 
        // have the `fid` in the payload body unless it's in the headers/signature). 

        // Let's inspect headers. The `miniapp_added` event is verifiable via library.
        // Actually, looking at the docs, Farcaster clients POST the event with a signature.
        console.log('Webhook received:', event, notificationDetails);

        // We will pause integration here to handle proper FID extraction.
        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
