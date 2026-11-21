export default {
  skipTrailingSlashRedirect: true,
  webpack(config){config.resolve.extensionAlias={...config.resolve.extensionAlias,'.js':['.js','.ts','.tsx']};return config},
  turbopack:{resolveExtensions:['.tsx','.ts','.jsx','.js','.json']},
  devIndicators: false,
  experimental: { cpus: 2 },
  async rewrites() {
    return [
      {
        source: "/socket.io/",
        destination:
          (process.env.SOCKET_PROXY || "http://127.0.0.1:4000") +
          "/socket.io/",
      },
    ];
  },
};
