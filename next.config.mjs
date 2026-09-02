/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        /* Les réponses d'API portent des données privées (prospects,
           boîte mail, session). Sans ça, Next les marque « public », ce
           qui autorise navigateurs et caches intermédiaires à les
           stocker : données périmées à l'écran, et risque de fuite entre
           comptes. */
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
