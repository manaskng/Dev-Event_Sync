import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    useCache: true, // <--- ENABLED HERE
    serverActions: {
      bodySizeLimit: '4mb', 
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/**' },
      { protocol: 'https', hostname: 'd8it4huxumps7.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: 'assets.devfolio.co', pathname: '/**' },
      { protocol: 'https', hostname: 's3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'hrcdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' }
    ]
  },

  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  
  skipTrailingSlashRedirect: true,
};

export default nextConfig;