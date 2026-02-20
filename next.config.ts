import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/.well-known/farcaster.json",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/share",
        destination: "https://warpcast.com/~/compose?text=I+just+played+Arbitrum+Roulette!+Come+spin+the+neon+wheel+and+win+ARB+rewards+on-chain.&embeds[]=https://rouletee.vercel.app",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
