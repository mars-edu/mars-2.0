<template>
  <div class="h-full">
    <!-- Report Card -->
    <div
      class="bg-card rounded-[32px] p-8 shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors group flex flex-col justify-between min-h-[180px] h-full"
      @click="navigate('/reports')"
    >
      <div>
        <div class="flex justify-between items-start mb-5">
          <div
            class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"
          >
            <IconFileText class="w-7 h-7" />
          </div>
          <IconArrowUpRight
            class="text-2xl w-6 h-6 text-muted-foreground/40 group-hover:text-primary transition-colors"
          />
        </div>
        <h3 class="text-xl font-bold text-foreground">
          {{ m.home_quick_actions_report_title() }}
        </h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          {{ m.home_quick_actions_report_desc() }}
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-primary text-sm font-bold flex items-center gap-1">
          {{ m.home_quick_actions_report_start() }}
          <IconChevronRight class="text-xs w-3 h-3" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconChevronRight from "~icons/lucide/chevron-right";
import * as m from "@/paraglide/messages";

const navigate = (path: string) => {
  f7.views.main.router.navigate(path);
};
</script>
