<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="ktp-detail-view-popover"
    :opened="opened"
    @popover:closed="$emit('update:opened', false)"
    style="width: 600px !important"
    :target-el="target"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        title="Просмотр темы занятия"
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      />

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-3">
        <div class="space-y-2">
          <label class="text-sm text-foreground"> Тема занятия </label>
          <div class="p-3 bg-muted rounded-lg text-sm text-foreground">
            {{ detail?.theme || "Не указана" }}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground"> Всего часов </label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.totalHours || "—" }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground">СРСП</label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.srsp || "—" }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground">СРС</label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.srs || "—" }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground">Теория</label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.theoretical || "—" }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground">Практика</label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.practical || "—" }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground">Индивид.</label>
            <div
              class="p-3 bg-muted rounded-lg text-sm text-foreground text-center"
            >
              {{ detail?.individual || "—" }}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground"> Что задано? </label>
          <div class="p-3 bg-muted rounded-lg text-sm text-foreground">
            {{ detail?.homework || "Не указано" }}
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground"> Примечание </label>
          <div class="p-3 bg-muted rounded-lg text-sm text-foreground">
            {{ detail?.notes || "Нет примечаний" }}
          </div>
        </div>
      </div>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { KtpDetail } from "@/stores/ktpStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  opened: boolean;
  target: string;
  detail: KtpDetail | null;
}>();

const emit = defineEmits(["update:opened"]);

const formError = ref("");
</script>
