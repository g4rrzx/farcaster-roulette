import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster';
const apiKey = process.env.NEYNAR_API_KEY;

async function testV1(path) {
    const res = await fetch(`https://api.neynar.com/v1/farcaster${path}`, {
        headers: { 'accept': 'application/json', 'api_key': apiKey },
    });
    console.log(`\n\n--- Testing V1 ${path} ---`);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
}

async function run() {
    const userFid = 239311; // g4rrzx
    const TARGET_CAST_HASH = '0xd77c1cf1';
    
    // Test V1 endpoints to see if we can get recasts/likes
    await testV1(`/cast?hash=${TARGET_CAST_HASH}&viewerFid=${userFid}`);
}

run();
