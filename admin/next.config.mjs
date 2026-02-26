const distDir = process.env.NEXT_DIST_DIR || ".next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir,
  webpack: (config, { dev }) => {
    // Prevent stale webpack cache artifacts that intermittently break CSS/chunks in dev.
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
