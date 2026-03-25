import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    'remotion',
    'esbuild',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-darwin-arm64',
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
