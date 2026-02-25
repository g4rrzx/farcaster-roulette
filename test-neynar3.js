import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const apiKey = process.env.NEYNAR_API_KEY;
console.log("API Key length:", apiKey ? apiKey.length : 0);

async function testHeader(headerName) {
    console.log(`\n--- Testing with header: ${headerName} ---`);
    const res = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=0xd77c1cf1&type=hash&viewer_fid=239311`, {
        headers: { 'accept': 'application/json', [headerName]: apiKey },
    });
    console.log("Status:", res.status);
    try {
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2).substring(0, 300));
    } catch(e) {
        console.log("Failed to parse JSON", await res.text());
    }
}

async function run() {
    await testHeader('x-api-key');
    await testHeader('api_key');
    await testHeader('Authorization');
}
run();
