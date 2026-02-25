import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve('/home/garr/roulete/rouletee/.env.local') });

const apiKey = process.env.NEYNAR_API_KEY;

async function run() {
    try {
        const res = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=0xd77c1cf1&type=hash&viewer_fid=239311`, {
            headers: { 'accept': 'application/json', 'x-api-key': apiKey },
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Neynar API error (${res.status}): ${txt}`);
        }
        const data = await res.json();
        console.log("Success data:", JSON.stringify(data).substring(0, 200));
        
        const viewerContext = data.cast?.viewer_context;
        if (viewerContext) {
            console.log("Viewer context:", viewerContext);
        } else {
            console.log("No viewer context");
        }
    } catch(e) {
        console.log("Caught Error:", e.message);
    }
}
run();
