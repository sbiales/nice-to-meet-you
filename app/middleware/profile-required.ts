export default defineNuxtRouteMiddleware(async () => {
  try {
    await $fetch('/api/profiles/me')
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return navigateTo('/signin')
    }
    if (error?.statusCode === 404) {
      return navigateTo('/onboarding')
    }
  }
})
