import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist({
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb", // Para upload de audio desde el botón de voz
    },
  },
});
