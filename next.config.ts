import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"liveblocks.io",
        port:"",
      }
    ]
  }
};

export default nextConfig;
