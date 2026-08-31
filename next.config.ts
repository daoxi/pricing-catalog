import type { NextConfig } from "next";

const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        pathname: contentfulSpaceId ? `/${contentfulSpaceId}/**` : "/**",
      },
    ],
  },
};

export default nextConfig;
