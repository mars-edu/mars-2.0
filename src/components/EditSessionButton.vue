<template>
  <div>
    <f7-popover
      :id="'edit-session-popover-' + session.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#session-item-${session.id}`"
    >
      <div class="session-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать сессию"
          :disabled="!isFormValid || sessionStore.isLoading"
          :is-loading="sessionStore.isLoading"
          :on-cancel="closePopover"
          :on-save="handleUpdateSession"
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
                :calendar-params="calendarParams"
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
                :calendar-params="calendarParams"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="confirmDelete"
              :disabled="sessionStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              />
              Удалить сессию
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { f7, f7Input, f7Icon, f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { z } from "zod";
import { useSessionStore } from "@/stores/sessionStore";
import type { Session } from "@/stores/sessionStore";
import { calendarParams } from "@/constants/period";

const props = defineProps<{ session: Session }>();

const sessionStore = useSessionStore();

const shortName = ref(props.session.shortName);
const fullName = ref(props.session.fullName);
const startDate = ref<Date[]>([new Date(props.session.startDate)]);
const endDate = ref<Date[]>([new Date(props.session.endDate)]);
const formError = ref("");

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
  f7.popover.close(`#edit-session-popover-${props.session.id}`);
  sessionStore.clearError();
};

const handleUpdateSession = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await sessionStore.updateSession(props.session.id, {
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format("YYYY-MM-DD"),
      endDate: dayjs(endDate.value[0]).format("YYYY-MM-DD"),
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update session:", error);
  }
};

const confirmDelete = () => {
  f7.popover.close(`#edit-session-popover-${props.session.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить сессию "${props.session.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление сессии",
    async () => {
      try {
        await sessionStore.deleteSession(props.session.id);
      } catch (error) {
        console.error("Failed to delete session:", error);
        f7.dialog.alert("Произошла ошибка при удалении сессии.");
      }
    }
  );
};
</script>
