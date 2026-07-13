import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tauri가 정적 파일(out/)을 서빙하므로 static export로 빌드한다
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
