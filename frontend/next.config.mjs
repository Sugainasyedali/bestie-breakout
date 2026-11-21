export default {
  devIndicators: false,
  experimental: { cpus: 2 },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination:
          (process.env.SOCKET_PROXY || "http://127.0.0.1:4000") +
          "/socket.io/:path*",
      },
    ];
  },
};
