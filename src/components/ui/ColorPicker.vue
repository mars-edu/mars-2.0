<template>
  <div class="space-y-1.5 relative" ref="containerRef">
    <div v-if="label" class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
      {{ label }}
    </div>
    
    <!-- Trigger Button -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-4 py-3 rounded-xl min-h-[52px] transition-all border-2"
      :class="isOpen ? 'bg-white border-black shadow-sm' : 'bg-[#F2F2F7] border-transparent hover:bg-[#E5E5EA]'"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-6 h-6 rounded-full shadow-sm border border-black/5"
          :style="{ backgroundColor: `var(${currentColor?.var || '--ios-gray'})` }"
        ></div>
        <span class="text-[17px] font-medium text-foreground tracking-tight">{{ currentColor?.name || 'Gray' }}</span>
      </div>
      <IconChevronDown 
        class="w-5 h-5 text-muted-foreground/50 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Custom Dropdown Palette -->
    <div
      v-if="isOpen"
      class="absolute z-[100] top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 p-6 animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="flex flex-col gap-6">
        <!-- Row 1: 11 Primary Colors -->
        <div class="flex justify-between items-center gap-1">
          <button
            v-for="color in row1"
            :key="color.hex"
            type="button"
            @click="selectColor(color)"
            class="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 shadow-sm border border-black/5 relative"
            :style="{ backgroundColor: `var(${color.var})` }"
            :title="color.name"
          >
            <!-- Selection Indicator (Double border style) -->
            <template v-if="isColorSelected(color)">
              <div
                class="absolute inset-[-4px] rounded-full border-2"
                :style="{ borderColor: `var(${color.var})` }"
              ></div>
              <div
                class="absolute inset-[-2px] rounded-full border-2 border-white"
              ></div>
            </template>
          </button>
        </div>
        
        <!-- Row 2: 2 Centered Colors -->
        <div class="flex justify-center items-center gap-4">
          <button
            v-for="color in row2"
            :key="color.hex"
            type="button"
            @click="selectColor(color)"
            class="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 shadow-sm border border-black/5 relative"
            :style="{ backgroundColor: `var(${color.var})` }"
            :title="color.name"
          >
            <!-- Selection Indicator -->
            <template v-if="isColorSelected(color)">
              <div
                class="absolute inset-[-4px] rounded-full border-2"
                :style="{ borderColor: `var(${color.var})` }"
              ></div>
              <div
                class="absolute inset-[-2px] rounded-full border-2 border-white"
              ></div>
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import {
  color_red,
  color_orange,
  color_yellow,
  color_green,
  color_mint,
  color_teal,
  color_cyan,
  color_blue,
  color_indigo,
  color_purple,
  color_pink,
  color_brown,
  color_gray,
  color_picker_label,
} from "@/paraglide/messages";

interface Color {
  name: string;
  hex: string;
  var: string;
}

const COLORS = computed((): Color[] => [
  { name: color_red(), hex: '#FF3B30', var: '--ios-red' },
  { name: color_orange(), hex: '#FF9500', var: '--ios-orange' },
  { name: color_yellow(), hex: '#FFCC00', var: '--ios-yellow' },
  { name: color_green(), hex: '#34C759', var: '--ios-green' },
  { name: color_mint(), hex: '#00C7BE', var: '--ios-mint' },
  { name: color_teal(), hex: '#30B0C7', var: '--ios-teal' },
  { name: color_cyan(), hex: '#32ADE6', var: '--ios-cyan' },
  { name: color_blue(), hex: '#007AFF', var: '--ios-blue' },
  { name: color_indigo(), hex: '#5856D6', var: '--ios-indigo' },
  { name: color_purple(), hex: '#AF52DE', var: '--ios-purple' },
  { name: color_pink(), hex: '#FF2D55', var: '--ios-pink' },
  { name: color_brown(), hex: '#A2845E', var: '--ios-brown' },
  { name: color_gray(), hex: '#8E8E93', var: '--ios-gray' },
]);

const row1 = computed(() => COLORS.value.slice(0, 11));
const row2 = computed(() => COLORS.value.slice(11));

interface Props {
  modelValue: { hex: string };
  targetId: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: () => color_picker_label(),
});

const emit = defineEmits<{
  "update:modelValue": [value: { hex: string }];
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const currentColor = computed(() => {
  const currentHex = (props.modelValue.hex || '#8E8E93').toUpperCase();
  return COLORS.value.find(c => c.hex.toUpperCase() === currentHex) || COLORS.value[12];
});

const isColorSelected = (color: Color) => {
  return props.modelValue.hex.toUpperCase() === color.hex.toUpperCase();
};

const selectColor = (color: Color) => {
  emit('update:modelValue', { hex: color.hex });
  isOpen.value = false;
};

const handleOutsideClick = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
});
</script>

<style scoped>
/* No component-specific vars needed, using global ones */
</style>
