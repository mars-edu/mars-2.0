<template>
  <div
    class="group relative overflow-hidden rounded-[18px] bg-card border border-border shadow-sm hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none flex flex-col p-4 gap-2.5"
    @click="handleClick"
  >
    <!-- Selection checkbox -->
    <div
      v-if="selectionMode"
      class="absolute top-3 right-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
      :class="selected ? 'bg-primary border-primary' : 'bg-card border-border'"
    >
      <f7-icon
        v-if="selected"
        ios="f7:checkmark"
        md="material:check"
        size="14px"
        class="text-white"
      />
    </div>

    <!-- Top row: icon + badges -->
    <div class="flex justify-between items-start">
      <div
        class="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[17px] font-extrabold flex-shrink-0"
        :style="{ background: accentColor.bg, color: accentColor.text }"
      >
        {{ titleInitial }}
      </div>
      <div class="flex flex-col items-end gap-1">
        <div
          v-if="courseNumber"
          class="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[5px]"
        >
          {{ courseNumber }} Курс
        </div>
        <div class="bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]">
          {{ studentCount }} студ.
        </div>
      </div>
    </div>

    <!-- Title + subtitle -->
    <div>
      <p class="text-[13px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ title }}
      </p>
      <p class="text-[11px] text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
        {{ subtitle }}
      </p>
    </div>

    <!-- Hover chevron -->
    <div
      v-if="!selectionMode"
      class="absolute bottom-3 right-3 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <f7-icon ios="f7:chevron_right" md="material:chevron_right" size="12px" />
    </div>

    <!--
      Progress ring (commented out — preserved for future use)
      <div class="shrink-0 w-10 h-10 relative self-end">
        <svg viewBox="0 0 44 44" class="w-10 h-10 -rotate-90">
          <circle cx="22" cy="22" r="18" stroke="rgba(156,163,175,0.2)" stroke-width="4" fill="none" stroke-linecap="round" />
          <circle cx="22" cy="22" r="18" :stroke="progressColor" stroke-width="4" fill="none" stroke-linecap="round"
            :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" class="transition-all duration-500" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-[10px] font-bold text-foreground">{{ percent }}%</span>
        </div>
      </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AccentColor {
  bg: string
  text: string
}

interface Props {
  title: string
  subtitle: string
  accentColor: AccentColor
  courseNumber?: number
  studentCount?: number
  selectionMode?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  studentCount: 0,
  selectionMode: false,
  selected: false,
})

const emit = defineEmits<{
  click: []
  'toggle-select': []
}>()

const titleInitial = computed(() => props.title.charAt(0).toUpperCase())

const handleClick = () => {
  if (props.selectionMode) {
    emit('toggle-select')
  } else {
    emit('click')
  }
}
</script>
