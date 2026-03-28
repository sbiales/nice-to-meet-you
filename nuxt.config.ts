// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  components: [
    { path: '~/components', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],

  nitro: {
    preset: 'node-server',
  },

  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/onboarding': { ssr: false },
    // All other routes (including /:username) default to SSR
  },

  runtimeConfig: {
    public: {
      appUrl: '',
    },
  },
})
