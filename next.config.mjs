/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
                            default-src 'self';
                            connect-src 'self' https://api.dscvr.one https://api1.stg.dsscvr.one https://mainnet.helius-rpc.com;
                            script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval';
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' data:;
                            font-src 'self' data:;
                        `.replace(/\s+/g, ' ').trim(),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;