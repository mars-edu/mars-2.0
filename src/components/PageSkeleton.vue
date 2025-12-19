<template>
  <f7-page
    class="flex flex-col h-screen bg-background text-foreground"
    data-skeleton-page
  >
    <!-- Header Skeleton -->
    <div class="hidden md:block flex-shrink-0 border-b border-border p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 bg-muted animate-pulse rounded"></div>
          <div class="w-32 h-6 bg-muted animate-pulse rounded"></div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-24 h-8 bg-muted animate-pulse rounded"></div>
          <div class="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
        </div>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Skeleton -->
      <div class="hidden md:block w-52 border-r border-border bg-card">
        <div class="p-4 space-y-3">
          <div class="w-full h-10 bg-muted animate-pulse rounded"></div>
          <div class="w-full h-10 bg-muted animate-pulse rounded"></div>
          <div class="w-full h-10 bg-muted animate-pulse rounded"></div>
          <div class="w-full h-10 bg-muted animate-pulse rounded"></div>
        </div>
      </div>

      <!-- Main Content Skeleton -->
      <div class="flex-1 overflow-y-auto p-3 md:p-4 bg-background md:ml-32">
        <!-- Alert/Info Bar Skeleton -->
        <div class="mb-4">
          <div class="bg-muted/50 h-16 animate-pulse rounded-lg"></div>
        </div>

        <!-- Page Title and Filters Skeleton -->
        <div class="bg-card rounded-xl p-4 md:p-6 shadow-sm mb-4">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between md:gap-3 mb-4"
          >
            <div
              class="w-48 h-6 bg-muted animate-pulse rounded mb-2 md:mb-0"
            ></div>
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 gap-2"
            >
              <div class="w-[250px] h-10 bg-muted animate-pulse rounded"></div>
              <div class="w-[220px] h-10 bg-muted animate-pulse rounded"></div>
            </div>
          </div>

          <!-- Table Header Skeleton -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div
              class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_120px_100px_100px] gap-4 px-4 py-3 bg-muted/50"
            >
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
              <div
                class="h-4 bg-muted-foreground/30 animate-pulse rounded"
              ></div>
            </div>

            <!-- Table Rows Skeleton -->
            <div class="divide-y divide-border">
              <div
                v-for="i in 5"
                :key="i"
                class="grid grid-cols-[minmax(0,_1fr)_100px_100px_120px_120px_100px_100px] gap-4 px-4 py-3"
              >
                <div class="space-y-2">
                  <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div class="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
                <div class="h-6 bg-muted animate-pulse rounded w-full"></div>
                <div class="h-6 bg-muted animate-pulse rounded w-full"></div>
                <div class="h-6 bg-muted animate-pulse rounded w-full"></div>
                <div class="h-6 bg-muted animate-pulse rounded w-full"></div>
                <div class="h-8 bg-muted animate-pulse rounded w-full"></div>
                <div class="h-8 bg-muted animate-pulse rounded w-full"></div>
              </div>
            </div>
          </div>

          <!-- Additional Content Skeleton -->
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-muted/50 h-24 animate-pulse rounded-lg"></div>
            <div class="bg-muted/50 h-24 animate-pulse rounded-lg"></div>
            <div class="bg-muted/50 h-24 animate-pulse rounded-lg"></div>
          </div>
        </div>

        <!-- FAB Button Skeleton -->
        <div class="fixed bottom-6 right-6 md:bottom-6 md:right-6 z-50">
          <div
            class="w-14 h-14 bg-primary rounded-full animate-pulse shadow-lg"
          ></div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { f7Page } from "framework7-vue";

defineOptions({
  name: "PageSkeleton",
});
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
