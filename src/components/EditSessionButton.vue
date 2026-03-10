<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="session"
      :id="'edit-session-popover-' + session.id"
      style="width: 600px !important"
      :target="`#session-item-${session.id}`"
    >
      <div class="session-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать сессию"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || sessionStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || sessionStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="session-short-name-edit"
            >
              Краткое название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="session-short-name-edit"
              type="text"
              v-model:value="shortName"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="session-full-name-edit">
              Полное название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="session-full-name-edit"
              type="text"
              v-model:value="fullName"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="text-sm text-foreground"
                for="session-start-date-edit"
              >
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="session-start-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-sm text-foreground"
                for="session-end-date-edit"
              >
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="session-end-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="confirmDelete"
              :disabled="sessionStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить сессию
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateSession"
          :disabled="!isFormValid || sessionStore.isLoading"
          :is-loading="sessionStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Input, f7Popover } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { z } from "zod";
import { useSessionStore } from "@/stores/sessionStore";
import type { Session } from "@/stores/sessionStore";
import { getDatePickerParams } from "@/constants/calendar";

const DATE_PICKER_PARAMS = getDatePickerParams();

const props = defineProps<{ sessionId: string }>();

const sessionStore = useSessionStore();

// Get session from store by ID - always fresh data
const session = computed(() => sessionStore.getSessionById(props.sessionId));

const shortName = ref("");
const fullName = ref("");
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const formError = ref("");

// Update form fields whenever session data changes
watchEffect(() => {
  if (session.value) {
    shortName.value = session.value.shortName;
    fullName.value = session.value.fullName;
    startDate.value = [new Date(session.value.startDate)];
    endDate.value = [new Date(session.value.endDate)];
  }
});

const sessionSchema = z
  .object({
    shortName: z.string().min(1),
    fullName: z.string().min(1),
    startDate: z.array(z.date()).min(1),
    endDate: z.array(z.date()).min(1),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      data.endDate[0] > data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );

const validationResult = computed(() => {
  return sessionSchema.safeParse({
    shortName: shortName.value,
    fullName: fullName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closePopover = () => {
  if (!session.value) return;
  f7.popover.close(`#edit-session-popover-${session.value.id}`);
  sessionStore.clearError();
};

const handleUpdateSession = async () => {
  if (!isFormValid.value || !session.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await sessionStore.updateSession(session.value.id, {
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update session:", error);
  }
};

const confirmDelete = () => {
  if (!session.value) return;
  f7.popover.close(`#edit-session-popover-${session.value.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить сессию "${session.value.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление сессии",
    async () => {
      if (!session.value) return;
      try {
        await sessionStore.deleteSession(session.value.id);
      } catch (error) {
        console.error("Failed to delete session:", error);
        f7.dialog.alert("Произошла ошибка при удалении сессии.");
      }
    }
  );
};
</script>
