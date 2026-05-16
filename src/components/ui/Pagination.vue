<template>
  <div class="flex items-center justify-between px-4 py-3 bg-card border-t border-border sm:px-6">
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="relative inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ common_pagination_prev() }}
      </button>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="relative ml-3 inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ common_pagination_next() }}
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">
          {{ common_pagination_page() }} <span class="font-medium text-foreground">{{ currentPage }}</span> {{ common_pagination_of() }}
          <span class="font-medium text-foreground">{{ totalPages }}</span>
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span class="sr-only">Previous</span>
            <IconChevronLeft class="h-5 w-5" aria-hidden="true" />
          </button>
          
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="setPage(page as number)"
              :aria-current="currentPage === page ? 'page' : undefined"
              class="relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all"
              :class="currentPage === page 
                ? 'z-10 bg-primary text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-md' 
                : 'text-foreground hover:bg-muted focus:z-20 focus:outline-offset-0'"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-muted-foreground focus:outline-offset-0"
            >
              ...
            </span>
          </template>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:z-20 focus:outline-offset-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span class="sr-only">Next</span>
            <IconChevronRight class="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";
import {
  common_pagination_page,
  common_pagination_of,
  common_pagination_next,
  common_pagination_prev,
} from "@/paraglide/messages";

const props = defineProps<{
  totalItems: number;
  pageSize: number;
  currentPage: number;
}>();

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize) || 1);

const visiblePages = computed(() => {
  const current = props.currentPage;
  const last = totalPages.value;
  const delta = 2;
  const left = current - delta;
  const right = current + delta + 1;
  const range: (number | string)[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l) {
      if (typeof i === 'number' && i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (typeof i === 'number' && i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    if (typeof i === 'number') l = i;
  }

  return rangeWithDots;
});

const setPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page);
  }
};

const prevPage = () => setPage(props.currentPage - 1);
const nextPage = () => setPage(props.currentPage + 1);
</script>
