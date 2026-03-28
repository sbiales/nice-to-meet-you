// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  nitro: {
    preset: 'node-server',
  },

  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    // All other routes (including /:username) default to SSR
  },

  runtimeConfig: {
    // Server-only — never exposed to client
    databaseUrl: '',
    s3Endpoint: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Bucket: '',
    resendApiKey: '',
    smtpHost: '',
    smtpPort: '',
    googleClientId: '',
    googleClientSecret: '',
    betterAuthSecret: '',
    public: {
      appUrl: '',
    },
  },
})
