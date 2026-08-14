/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/decoy',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
