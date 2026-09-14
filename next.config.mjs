/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions são o mecanismo primário de mutação (ver spec secção 2).
    serverActions: {
      bodySizeLimit: "5mb", // permite upload de fotografia de membro
    },
  },
};

export default nextConfig;
