/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Prevent stale webpack cache artifacts that intermittently break CSS/chunks in dev.
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
