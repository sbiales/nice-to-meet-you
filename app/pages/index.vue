<script setup lang="ts">
definePageMeta({ layout: 'default' })

const valueProps = [
  {
    title: 'Privacy-first',
    body: 'Your email and phone number are never exposed. Anyone who reaches out goes through your page.',
  },
  {
    title: 'No algorithm',
    body: 'No feed, no matching, no pressure. Just your page, exactly as you made it.',
  },
  {
    title: 'Works for everyone',
    body: 'Looking for love? New friends? Professional connections? Your page works for all of it.',
  },
  {
    title: 'Free to start',
    body: 'Create your page and generate your QR code, on us.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Create your page',
    body: 'Tell your story in your own words. Add photos, your interests, and what you\'re looking for.',
  },
  {
    number: '2',
    title: 'Generate your QR code',
    body: 'Download it and print it on whatever you want — your tote bag, your hat, a sticker.',
  },
  {
    number: '3',
    title: 'Put yourself out there',
    body: 'Someone scans it, reads your page, and reaches out. No awkward introductions required.',
  },
]
</script>

<template>
  <div>
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-warm-border bg-warm-card/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NuxtLink
          to="/"
          class="text-xs font-bold tracking-[0.2em] text-warm-text uppercase"
        >
          ntmy
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/signin"
            class="rounded-md px-4 py-2 text-sm text-warm-muted transition-colors hover:text-warm-text"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="rounded-md bg-sage-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-600"
          >
            Get started
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-sage-400 py-28 text-white md:py-36">
      <!-- Decorative blobs -->
      <div
        class="pointer-events-none absolute -top-32 -right-32 h-[36rem] w-[36rem] rounded-full bg-sage-300 opacity-25 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-sage-600 opacity-25 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 class="font-handwriting text-6xl leading-tight tracking-wide text-white md:text-7xl lg:text-8xl">
          Nice To Meet You
        </h1>
        <p class="mt-4 text-xl italic text-white/90 md:text-2xl">
          Become approachable without saying a word
        </p>
        <p class="mx-auto mt-6 max-w-2xl text-base text-white/80 md:text-lg">
          Your personal page, your way. Print your QR code, put it in the world,
          and let people reach out — without ever giving up your contact details.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <NuxtLink
            to="/signup"
            class="rounded-md bg-white px-6 py-3 text-sm font-semibold text-sage-700 shadow-sm transition-colors hover:bg-sage-50"
          >
            Create your page
          </NuxtLink>
          <a
            href="#how-it-works"
            class="rounded-md border border-white/60 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>

    <!-- Why we made this -->
    <section class="bg-sage-50 py-24">
      <div class="mx-auto max-w-3xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          Why we made this
        </h2>
        <div class="mt-10 space-y-6 text-lg leading-relaxed text-warm-muted">
          <p>
            Everyone is online these days — but real connections still happen in person.
            At the coffee shop, at a concert, on the train. The problem? Walking up to
            a stranger is hard. Handing someone your number is vulnerable.
          </p>
          <p>
            Nice To Meet You is different. You create a page that represents you — who you
            are, what you love, what you're looking for. Print a QR code and put it on
            whatever you want: your tote bag, your hat, your business card. Now when someone
            notices you, they have a way in — on their own terms.
          </p>
          <p>
            Whether you're looking for love, new friends, or just want a shareable presence
            when you're out in the world — your page has you covered.
          </p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="bg-warm-bg py-24">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          How it works
        </h2>
        <div class="mt-16 grid gap-12 md:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-center text-center"
          >
            <span class="font-handwriting text-6xl font-bold text-sage-400">
              {{ step.number }}
            </span>
            <h3 class="mt-3 text-xl font-semibold text-warm-text">{{ step.title }}</h3>
            <p class="mt-2 text-warm-muted">{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Value props -->
    <section class="bg-warm-card py-24">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-semibold text-warm-text">
          Built different
        </h2>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard v-for="prop in valueProps" :key="prop.title" class="flex flex-col gap-2">
            <h3 class="font-semibold text-warm-text">{{ prop.title }}</h3>
            <p class="text-sm text-warm-muted">{{ prop.body }}</p>
          </AppCard>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-warm-border bg-warm-bg py-10">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
        <p class="text-sm text-warm-muted">
          © {{ new Date().getFullYear() }} Nice To Meet You
        </p>
        <div class="flex gap-4">
          <NuxtLink to="/signin" class="text-sm text-warm-muted hover:text-warm-text">
            Sign in
          </NuxtLink>
          <NuxtLink to="/signup" class="text-sm text-warm-muted hover:text-warm-text">
            Get started
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
