import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    sassOptions: {
        // https://github.com/vercel/next.js/issues/71638
        silenceDeprecations: ["legacy-js-api"],
    }
};

export default nextConfig;
