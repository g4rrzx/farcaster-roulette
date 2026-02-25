import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const apiKey = process.env.NEYNAR_API_KEY;

async function run() {
    const res = await fetch('https://api.neynar.com/v2/farcaster/cast?identifier=0xd77c1cf1&type=hash&viewer_fid=239311', {
        headers: { 'accept': 'application/json', 'api_key': apiKey }
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
}
run();
