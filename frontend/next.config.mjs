/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['mini-jira-resized-438987839653.s3.amazonaws.com', 'd1kjmg4gujmstj.cloudfront.net'],
  },
};

export default nextConfig;
