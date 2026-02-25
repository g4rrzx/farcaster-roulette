async function run() {
    const res = await fetch('https://rouletee.vercel.app/api/quests/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: 239311, questType: 'follow' })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
}
run();
