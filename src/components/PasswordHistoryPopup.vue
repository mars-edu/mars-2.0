<template>
  <f7-popup
    :id="`password-history-popup-${teacherId}`"
    class="password-history-popup"
    push
    @popup:closed="onClose"
  >
    <f7-page>
      <PopoverHeader
        title="История изменения пароля"
        @close="f7.popup.close(`#password-history-popup-${teacherId}`)"
      />

      <f7-page-content class="p-4">
        <div v-if="loading" class="text-center py-8">
          <f7-preloader />
          <p class="text-muted mt-2">Загрузка истории...</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-500">{{ error }}</p>
        </div>

        <div v-else-if="history.length === 0" class="text-center py-8">
          <p class="text-muted">История изменений пароля пуста</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="entry in history"
            :key="entry._id"
            class="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="px-2 py-1 rounded text-xs font-semibold"
                    :class="getChangeTypeBadgeClass(entry.changeType)"
                  >
                    {{ getChangeTypeLabel(entry.changeType) }}
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ formatDate(entry.createdAt) }}
                  </span>
                </div>

                <div class="text-sm text-gray-700 mb-1">
                  <strong>Изменено:</strong> {{ entry.changedByName }}
                </div>

                <div v-if="entry.notes" class="text-sm text-gray-600 italic">
                  {{ entry.notes }}
                </div>
              </div>

              <div class="text-xs text-gray-400">
                {{ formatTime(entry.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </f7-page-content>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { f7Popup, f7Page, f7PageContent, f7Preloader, f7 } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useI18n } from "@/composables/useI18n";

const props = defineProps<{
  teacherId: string;
  userId: string;
}>();

const { locale } = useI18n();

const history = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const loadHistory = async () => {
  try {
    loading.value = true;
    error.value = null;

    const data = await convex.query(api.passwordHistory.queries.getPasswordHistory, {
      userId: props.userId as any,
      limit: 50,
    });

    history.value = data;
  } catch (err) {
    console.error("Failed to load password history:", err);
    error.value = "Не удалось загрузить историю изменений";
  } finally {
    loading.value = false;
  }
};

const getChangeTypeLabel = (type: string) => {
  switch (type) {
    case "initial":
      return "Создание аккаунта";
    case "regenerated":
      return "Пароль обновлён";
    case "reset":
      return "Сброс пароля";
    default:
      return type;
  }
};

const getChangeTypeBadgeClass = (type: string) => {
  switch (type) {
    case "initial":
      return "bg-blue-100 text-blue-800";
    case "regenerated":
      return "bg-green-100 text-green-800";
    case "reset":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale.value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const onClose = () => {
  history.value = [];
  error.value = null;
};

onMounted(() => {
  loadHistory();
});

watch(() => props.userId, () => {
  if (props.userId) {
    loadHistory();
  }
});
</script>

<style scoped>
.password-history-popup {
  --f7-popup-tablet-width: 600px;
}
</style>
