import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { notificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Decode Farcaster JFS if present
        let payloadObj;
        let fid;

        if (body?.payload && body?.header) {
            try {
                // Decode from base64url
                const decodedPayload = Buffer.from(body.payload, 'base64url').toString('utf-8');
                payloadObj = JSON.parse(decodedPayload);

                const decodedHeader = Buffer.from(body.header, 'base64url').toString('utf-8');
                const headerObj = JSON.parse(decodedHeader);
                fid = headerObj.fid;
            } catch (err) {
                console.error('Invalid base64 payload/header', err);
                return NextResponse.json({ success: false, error: 'Invalid payload encoding' }, { status: 400 });
            }
        } else {
            payloadObj = body;
            fid = body?.fid; // fallback if already decoded
        }

        // Ensure we have a valid payload
        if (!payloadObj || !payloadObj.event) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        const { event, notificationDetails } = payloadObj;

        console.log('Webhook received:', event, notificationDetails, 'FID:', fid);

        // Save the notification tokens
        if (event === 'frame_added' || event === 'miniapp_added') {
            if (fid && notificationDetails?.token && notificationDetails?.url) {
                try {
                    await db.insert(notificationTokens).values({
                        fid,
                        token: notificationDetails.token,
                        url: notificationDetails.url,
                    }).onConflictDoUpdate({
                        target: notificationTokens.fid,
                        set: {
                            token: notificationDetails.token,
                            url: notificationDetails.url,
                            updatedAt: new Date()
                        }
                    });
                    console.log(`Saved notification details for FID ${fid}`);
                } catch (e) {
                    console.error('Error saving notification tokens to DB', e);
                }
            } else {
                console.warn('Missing FID or notificationDetails for miniapp_added event');
            }
        } else if (event === 'frame_removed' || event === 'miniapp_removed') {
            if (fid) {
                try {
                    await db.delete(notificationTokens).where(eq(notificationTokens.fid, fid));
                    console.log(`Removed notification details for FID ${fid}`);
                } catch (e) {
                    console.error('Error removing notification tokens from DB', e);
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
