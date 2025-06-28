/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remove deprecated appDir option for Next.js 15
  },
  webpack: (config, { isServer }) => {
    // Add externals to prevent bundling server-incompatible packages
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Handle browser-specific APIs
    if (isServer) {
      // Mock browser APIs for server-side rendering
      config.resolve.alias = {
        ...config.resolve.alias,
        // Add any browser-specific library aliases here if needed
      };
    }
    
    // Ignore browser-only modules during server-side rendering
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Add compile-time environment variables
  env: {
    CUSTOM_KEY: 'landkrypt_app',
  },
};

export default nextConfig;

