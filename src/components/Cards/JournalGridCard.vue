<template>
  <div
    class="group relative rounded-[20px] bg-card border border-transparent shadow-sm transition-all duration-200 select-none flex flex-col p-4 gap-3"
    :class="[
      disabled
        ? 'opacity-40 grayscale cursor-not-allowed border-border'
        : 'hover:border-yellow-400 hover:shadow-[0_12px_32px_rgba(250,204,21,0.12)] hover:-translate-y-1 cursor-pointer'
    ]"
    :title="disabled && tooltip ? tooltip : undefined"
    @click="handleClick"
  >
    <!-- Top row: icon + hover menu OR selection checkbox -->
    <div class="flex justify-between items-start">
      <div class="relative flex-shrink-0">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-extrabold"
          :style="{ background: isMerged ? 'rgba(142,142,147,0.15)' : accentColor.bg, color: isMerged ? '#8E8E93' : accentColor.text }"
        >
          <IconGitMerge v-if="isMerged" class="w-6 h-6" />
          <template v-else>{{ titleInitial }}</template>
        </div>
      </div>

      <!-- Selection checkbox (replaces menu in selection mode) -->
      <div
        v-if="selectionMode"
        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
        :class="selected ? 'bg-primary border-primary' : 'bg-card border-border'"
      >
        <IconCheck v-if="selected" class="w-3.5 h-3.5 text-white" />
      </div>

      <!-- Per-card action menu (normal mode, visible on hover) -->
      <div v-else class="relative" @click.stop>
        <button
          ref="menuButtonRef"
          :class="isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          class="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          @click="openMenu"
        >
          <IconMoreVertical class="w-4 h-4" />
        </button>
        <Teleport to="body">
        <!-- Backdrop -->
        <div
          v-if="isMenuOpen"
          class="fixed inset-0 z-[9998]"
          @click="isMenuOpen = false"
        />
        <div
          v-if="isMenuOpen"
          class="fixed w-48 bg-card rounded-2xl shadow-2xl border border-border py-2 z-[9999]"
          :style="menuStyle"
        >
          <button
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            @click="emit('edit'); isMenuOpen = false"
          >
            <IconPencil class="w-4 h-4" />
            {{ journal_card_edit() }}
          </button>
          <button
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            @click="emit('substitute'); isMenuOpen = false"
          >
            <IconUserRoundCog class="w-4 h-4" />
            {{ journal_card_add_substitute() }}
          </button>
          <button
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            @click="emit('download'); isMenuOpen = false"
          >
            <IconDownload class="w-4 h-4" />
            {{ journal_card_download() }}
          </button>
          <div class="h-px bg-border my-1" />
          <button
            v-if="isMerged"
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
            @click="emit('split'); isMenuOpen = false"
          >
            <IconUngroup class="w-4 h-4" />
            {{ journal_card_split() }}
          </button>
          <button
            v-else
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
            @click="emit('delete'); isMenuOpen = false"
          >
            <IconTrash2 class="w-4 h-4" />
            {{ journal_card_delete() }}
          </button>
        </div>
        </Teleport>
      </div>
    </div>

    <!-- Title + subtitle -->
    <div class="flex-1">
      <p class="text-[22px] font-bold text-foreground leading-tight line-clamp-4 group-hover:text-primary transition-colors">
        {{ title }}
      </p>
      <p class="text-sm text-muted-foreground leading-relaxed line-clamp-1 mt-1">
        {{ subtitle }}
      </p>
    </div>

    <!-- Bottom badges -->
    <div class="flex flex-wrap items-center gap-2 mt-auto">
      <div
        v-if="isMerged"
        class="bg-gray-500/10 text-gray-500 text-[13px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5"
      >
        <IconGitMerge class="w-3.5 h-3.5" />
        {{ mergedCount }} журн.
      </div>
      <div
        v-if="courseNumber !== undefined"
        class="bg-primary/10 text-primary text-[13px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md"
      >
        {{ courseNumber }} Курс
      </div>
      <div class="bg-muted text-muted-foreground text-[13px] font-bold px-3 py-1.5 rounded-md">
        {{ studentCount }} студ.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import IconCheck from "~icons/lucide/check"
import IconMoreVertical from "~icons/lucide/more-vertical"
import IconDownload from "~icons/lucide/download"
import IconTrash2 from "~icons/lucide/trash-2"
import IconPencil from "~icons/lucide/pencil"
import IconUngroup from "~icons/lucide/ungroup"
import IconGitMerge from "~icons/lucide/git-merge"
import IconUserRoundCog from "~icons/lucide/user-round-cog"
import { journal_card_download, journal_card_delete, journal_card_edit, journal_card_split, journal_card_add_substitute } from "@/paraglide/messages"
import { useAnchoredDropdown } from "@/composables/useAnchoredDropdown"

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
  isMerged?: boolean
  mergedCount?: number
  disabled?: boolean
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  studentCount: 0,
  selectionMode: false,
  selected: false,
  isMerged: false,
  mergedCount: 0,
  disabled: false,
  tooltip: undefined,
})

const emit = defineEmits<{
  click: []
  'toggle-select': []
  download: []
  delete: []
  edit: []
  split: []
  substitute: []
}>()

const isMenuOpen = ref(false)
const menuButtonRef = ref<HTMLElement | null>(null)
const { dropdownStyle: menuStyle } = useAnchoredDropdown(menuButtonRef, isMenuOpen, { align: 'right' })
const titleInitial = computed(() => props.title.charAt(0).toUpperCase())

function openMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

const handleClick = () => {
  if (props.disabled) return
  if (props.selectionMode) {
    emit('toggle-select')
  } else {
    emit('click')
  }
}

watch(() => props.selectionMode, (val) => {
  if (val) isMenuOpen.value = false
})
</script>
