<template>
  <div>
    <f7-popover
      id="ktp-detail-popover"
      :arrow="false"
      style="
        width: calc(100vw - 50px) !important;
        height: calc(100dvh - 50px) !important;
      "
      close-on-escape
      @popover:closed="handlePopoverClosed"
    >
      <div class="ktp-detail-popover bg-card text-card-foreground">
        <div class="fixed-header">
          <PopoverHeader
            :title="displayTitle"
            cancel-text="Закрыть"
            :on-cancel="handleClose"
            :is-loading="loading"
          >
            <template #save>
              <Button
                variant="primary"
                size="md"
                class="ml-auto flex items-center gap-1"
                @click="handleDeleteAll"
              >
                <f7-icon
                  ios="f7:trash"
                  md="material:delete"
                  class="!text-sm"
                ></f7-icon>
                Удалить
              </Button>
            </template>
          </PopoverHeader>
        </div>

        <div class="scrollable-content">
          <KtpDetailPopupBody
            ref="popupBodyRef"
            :ktp-id="ktpId"
          />
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs, computed } from "vue";
import { f7, f7Popover, f7Icon } from "framework7-vue";
import { useKtpStore } from "@/stores/ktpStore";
import { useClass9Store } from "@/stores/class9Store";
import KtpDetailPopupBody from "@/components/KtpDetailPopupBody.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Button from "@/components/ui/Button.vue";
import { storeToRefs } from "pinia";

const props = defineProps<{
  ktpId: string | null;
  opened: boolean;
  moduleTitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
}>();

const { ktpId, opened } = toRefs(props);
const ktpStore = useKtpStore();
const class9Store = useClass9Store();
const { loading } = storeToRefs(ktpStore);
const { deleteKtpById } = ktpStore;
const popupBodyRef = ref<InstanceType<typeof KtpDetailPopupBody> | null>(null);
const isClosingProgrammatically = ref(false);

// Computed property to get the module name for the header
const computedModuleTitle = computed(() => {
  if (!ktpId.value) return "Рабочие учебные программы";
  const ktpItem = ktpStore.ktps.find((ktp: any) => ktp.id === ktpId.value);
  if (!ktpItem) return "Рабочие учебные программы";

  const class9Item = class9Store.getClass9ById(ktpItem.class9Id);
  if (!class9Item) return "Рабочие учебные программы";

  return `${class9Item.moduleIndex} - ${class9Item.moduleName}`;
});

// Use prop moduleTitle if provided, otherwise use computed value
const displayTitle = computed(() => {
  return props.moduleTitle || computedModuleTitle.value;
});

const handleClose = () => {
  emit("update:opened", false);
};

const handlePopoverClosed = () => {
  // Only emit if not closing programmatically from watch
  if (!isClosingProgrammatically.value) {
    emit("update:opened", false);
  }
  // Reset the flag
  isClosingProgrammatically.value = false;
};

function handleDeleteAll() {
  if (!ktpId.value) return;

  f7.dialog.confirm(
    "Вы уверены, что хотите удалить все темы КТП?",
    "Удаление КТП",
    () => {
      const result = deleteKtpById(ktpId.value as string);

      if (result.success) {
        f7.toast
          .create({
            text: `Все темы КТП успешно удалены${
              result.deleted > 0 ? ` (${result.deleted} записей)` : ""
            }`,
            closeTimeout: 3000,
            cssClass: "color-green",
          })
          .open();
      } else {
        f7.toast
          .create({
            text: "Ошибка при удалении КТП",
            closeTimeout: 3000,
            cssClass: "color-red",
          })
          .open();
      }
    }
  );
}

watch(ktpId, (newKtpId) => {
  if (newKtpId) {
    ktpStore.fetchDetailsForKtp(newKtpId);
  }
});

watch(opened, (isOpened, wasOpened) => {
  console.log("🔄 KtpDetailPopup opened watch triggered", { isOpened, wasOpened, ktpId: ktpId.value });
  if (isOpened && !wasOpened) {
    // Only open if transitioning from closed to open
    if (ktpId.value) {
      ktpStore.fetchDetailsForKtp(ktpId.value);
    }
    // Use nextTick to ensure the DOM is ready before opening
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        f7.popover.open("#ktp-detail-popover");
      });
    });
  } else if (!isOpened && wasOpened) {
    // Only close if transitioning from open to closed
    // Set flag to prevent double emission
    isClosingProgrammatically.value = true;
    f7.popover.close("#ktp-detail-popover");
  }
});
</script>

<style>
#ktp-detail-popover {
  left: 50%;
  transform: translateX(-50%);
}

.ktp-detail-popover {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
  border-bottom: 1px solid var(--f7-border-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100dvh - 120px);
}
</style>
