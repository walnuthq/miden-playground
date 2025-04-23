import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	experimental: {
		esmExternals: true
	},
	transpilePackages: ['nextstepjs']
};

export default nextConfig;
