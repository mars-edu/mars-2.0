<template>
  <div v-if="variant === 'sidebar'" class="h-16 flex items-center shrink-0 mb-2" :class="isExpanded ? 'px-5' : 'justify-center'">
    <div 
      class="flex items-center cursor-pointer group" 
      :class="isExpanded ? 'gap-4' : 'justify-center'"
      @click="navigateHome"
    >
      <div 
        class="relative flex items-center justify-center rounded-xl shadow-md transition-all group-hover:scale-110"
        :class="[
          isExpanded ? 'w-9 h-9' : 'w-10 h-10',
          logoBgClass
        ]"
      >
        <span class="font-bold" :class="isExpanded ? 'text-sm' : 'text-base'">M</span>
      </div>
      <span 
        v-if="isExpanded"
        class="font-bold text-lg tracking-tight transition-all duration-300 whitespace-nowrap text-foreground"
      >
        Mars
      </span>
    </div>
  </div>
  <a
    v-else-if="isProduction"
    class="flex items-center w-fit"
    href="/home"
  >
    <img :src="logoSrc" alt="Mars Logo" class="h-16" />
  </a>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { f7 } from "framework7-vue";

const props = defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value: string) => ["default", "light", "sidebar"].includes(value),
  },
  isExpanded: {
    type: Boolean,
    default: true,
  }
});

const themeStore = useThemeStore();

// const isProduction = ref(import.meta.env.MODE !== "development");
const isProduction = true;

const logoSrc = computed(() => {
  return new URL("/assets/LOGO.png", import.meta.url).href;
});

const logoBgClass = computed(() => {
  const theme = themeStore.currentTheme;
  switch (theme) {
    case 'dark': return 'bg-gray-800 text-white';
    case 'lavanda': return 'bg-purple-600 text-white';
    case 'coral': return 'bg-orange-500 text-white';
    case 'graphite': return 'bg-slate-700 text-white';
    default: return 'bg-gray-900 text-white';
  }
});

const navigateHome = () => {
  if (f7 && f7.views && f7.views.main) {
    f7.views.main.router.navigate("/home");
  } else {
    window.location.href = "/home";
  }
};

</script>
