<template>
  <div class="relative inline-block" ref="containerRef">
    <button
      class="add-rup-button w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors shadow-sm"
      :class="{
        'opacity-50 cursor-not-allowed bg-muted text-muted-foreground': disabled,
        'rotate-45': isMenuOpen,
      }"
      @click.stop="toggleMenu"
      :disabled="disabled"
      :title="
        disabled
          ? 'Сначала выберите специальность'
          : 'Создать рабочий учебный план'
      "
    >
      <IconPlus class="w-4 h-4 text-white transition-transform" />
    </button>

    <transition name="add-menu">
      <div
        v-if="isMenuOpen"
        class="add-menu absolute right-0 top-full mt-2 z-50 bg-card rounded-xl shadow-xl border border-border overflow-hidden w-56"
        @click.stop
      >
        <button
          type="button"
          class="menu-item w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-400 transition-colors"
          @click="handleSelect(9)"
        >
          <span class="w-8 h-8 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
            9
          </span>
          <span class="font-medium">На базе 9 классов</span>
        </button>
        <div class="border-t border-border"></div>
        <button
          type="button"
          class="menu-item w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted transition-colors"
          @click="handleSelect(11)"
        >
          <span class="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
            11
          </span>
          <span class="font-medium">На базе 11 классов</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import IconPlus from "~icons/lucide/plus";

defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "add", baseClass: number): void;
}>();

const isMenuOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function handleSelect(baseClass: number) {
  emit("add", baseClass);
  closeMenu();
}

function onDocumentClick(event: MouseEvent) {
  if (!isMenuOpen.value) return;
  const target = event.target as Node | null;
  if (containerRef.value && target && !containerRef.value.contains(target)) {
    closeMenu();
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && isMenuOpen.value) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscape);
});
</script>

<style scoped>
.add-rup-button {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.add-rup-button.rotate-45 {
  transform: rotate(45deg);
}

.add-menu-enter-active,
.add-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.add-menu-enter-from,
.add-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
