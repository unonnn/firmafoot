import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com um server.js autocontido — necessário pra imagem
  // Docker de produção não precisar do node_modules completo do Next em si.
  output: "standalone",
};

export default nextConfig;
