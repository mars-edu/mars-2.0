<!-- Navigation Demo Component -->
<template>
  <Card :theme="theme" title="Навигация">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold" :class="textClass">Демо навигации</h2>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm" :class="descriptionClass">
        Этот компонент демонстрирует пользовательскую обработку навигации
        браузера. Кнопки назад/вперед браузера были переопределены
        пользовательским поведением.
      </p>

      <div class="flex flex-wrap gap-3">
        <f7-button
          :fill="true"
          :color="theme === 'dark' ? 'white' : 'red'"
          @click="goToPage('/planning/')"
        >
          Планирование
        </f7-button>
        <f7-button
          :fill="true"
          :color="theme === 'dark' ? 'white' : 'red'"
          @click="goToPage('/schedule/')"
        >
          Расписание
        </f7-button>
        <f7-button
          :fill="true"
          :color="theme === 'dark' ? 'white' : 'red'"
          @click="goToPage('/settings/')"
        >
          Настройки
        </f7-button>
        <f7-button
          :fill="true"
          :color="theme === 'dark' ? 'white' : 'red'"
          @click="goBack"
        >
          Назад
        </f7-button>
      </div>

      <div class="mt-4 p-4 rounded-lg" :class="statBoxClasses">
        <div class="space-y-2">
          <div :class="statLabelClasses">
            <strong>Текущий URL:</strong> {{ currentUrl }}
          </div>
          <div :class="statLabelClasses">
            <strong>Размер стека:</strong> {{ historyStackSize }}
          </div>
          <div :class="statLabelClasses">
            <strong>Позиция:</strong> {{ currentPosition }}
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";
// import { setupCustomNavigation } from "../../js/navigation";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

// Navigation state tracking
const currentUrl = ref(window.location.href);
const historyStackSize = ref(1);
const currentPosition = ref(0);
// const navigation = ref(setupCustomNavigation());

// Computed styles
const textClass = computed(() => ({
  "text-gray-900": props.theme === "white",
  "text-white": props.theme === "dark",
  "text-purple-900": props.theme === "lavanda",
}));

const descriptionClass = computed(() => ({
  "text-gray-600": props.theme === "white",
  "text-gray-300": props.theme === "dark",
  "text-purple-600": props.theme === "lavanda",
}));

const statBoxClasses = computed(() => ({
  "bg-gray-50": props.theme === "white",
  "bg-gray-700": props.theme === "dark",
  "bg-purple-100": props.theme === "lavanda",
}));

const statLabelClasses = computed(() => ({
  "text-sm text-gray-600": props.theme === "white",
  "text-sm text-gray-300": props.theme === "dark",
  "text-sm text-purple-700": props.theme === "lavanda",
}));

// Initialize navigation handler on mount
onMounted(() => {
  f7ready(() => {
    navigation.value.initialize();
    currentUrl.value = window.location.href;
    currentPosition.value = window.history.state?.position || 0;

    setInterval(() => {
      currentUrl.value = window.location.href;
      currentPosition.value = window.history.state?.position || 0;
    }, 500);
  });
});

// Navigation methods
const goToPage = (url: string) => {
  navigation.value.navigateTo(url);
  historyStackSize.value++;
};

const goBack = () => {
  navigation.value.goBack();
  if (historyStackSize.value > 1) {
    historyStackSize.value--;
  }
};
</script>

<style scoped>
.navigation-demo {
  max-width: 800px;
  margin: 0 auto;
}
</style>
