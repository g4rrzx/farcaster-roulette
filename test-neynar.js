import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster';
const apiKey = process.env.NEYNAR_API_KEY;

async function test(path) {
    const res = await fetch(`${NEYNAR_API_BASE}${path}`, {
        headers: { 'accept': 'application/json', 'x-api-key': apiKey },
    });
    console.log(`\n\n--- Testing ${path} ---`);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
}

async function run() {
    const userFid = 239311; // g4rrzx
    const targetFid = 2309650; // @fcmini

    // 1. Follow check: Is userFid following targetFid?
    // Using user/bulk, checking targetFid's profile, with userFid as the viewer
    await test(`/user/bulk?fids=${targetFid}&viewer_fid=${userFid}`);

    // 2. Recast check: Did userFid recast/like the target cast?
    const TARGET_CAST_HASH = '0xd77c1cf1';
    await test(`/cast?identifier=${TARGET_CAST_HASH}&type=hash&viewer_fid=${userFid}`);
}

run();
