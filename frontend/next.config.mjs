/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    // In production (Vercel) NEXT_PUBLIC_API_URL points to Render backend.
    // In development it falls back to localhost so nothing changes for local work.
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
