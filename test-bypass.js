import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster';
const apiKey = process.env.NEYNAR_API_KEY;

async function testV1(path) {
    try {
        const res = await fetch(`https://api.neynar.com/v2/farcaster${path}`, {
            headers: { 'accept': 'application/json', 'api_key': apiKey },
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Neynar API error (${res.status}): ${txt}`);
        }
        return true;
    } catch(e) {
        console.log("Error message:", e.message);
        if (e.message?.includes('402')) {
            console.log("402 Bypass Triggered!");
            return true;
        }
        return false;
    }
}

async function run() {
    const userFid = 239311; // g4rrzx
    const TARGET_CAST_HASH = '0xd77c1cf1';
    
    // Test endpoints
    await testV1(`/cast?identifier=${TARGET_CAST_HASH}&type=hash&viewer_fid=${userFid}`);
}

run();
