<template>
  <f7-popup
    :opened="opened"
    @popup:closed="$emit('update:opened', false)"
    class="bg-background text-foreground ktp-detail-popup"
  >
    <f7-page>
      <f7-navbar>
        <f7-nav-title title="Рабочие учебные программы"></f7-nav-title>
        <f7-nav-right>
          <f7-link @click="openAddPopover">Добавить</f7-link>
          <f7-link popup-close>Закрыть</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="p-4 mt-8">
        <div class="space-y-3">
          <div
            class="bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <f7-icon
                ios="f7:chevron_down"
                md="material:expand_more"
              ></f7-icon>
              <span>Темы занятий</span>
            </div>
          </div>

          <div class="border border-border rounded-lg overflow-hidden">
            <div
              class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
            >
              <div class="font-medium text-center">№</div>
              <div class="font-medium">Темы занятий</div>
              <div class="font-medium text-center">Всего часов</div>
              <div class="font-medium text-center">СРСП</div>
              <div class="font-medium text-center">СРС</div>
              <div class="font-medium text-center">Что задано?</div>
            </div>

            <div v-if="loading" class="p-4 text-center text-muted-foreground">
              Загрузка деталей...
            </div>
            <div v-else class="divide-y divide-border">
              <div
                v-for="item in ktpDetails"
                :key="item.id"
                :id="`ktp-detail-item-${item.id}`"
                class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_80px_120px] gap-4 px-4 py-3 items-start cursor-pointer hover:bg-muted/50"
                :class="{
                  'bg-orange-400/80': item.id === selectedDetailId,
                }"
                @click="openEditPopover(item)"
              >
                <div class="text-center">{{ item.position }}</div>
                <div class="text-sm">{{ item.theme }}</div>
                <div class="text-center">{{ item.totalHours ?? "—" }}</div>
                <div class="text-center">{{ item.srsp ?? "—" }}</div>
                <div class="text-center">{{ item.srs ?? "—" }}</div>
                <div class="text-center">{{ item.homework || "—" }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <f7-fab
        position="right-bottom"
        slot="fixed"
        id="add-ktp-detail-fab"
        @click="openAddPopover"
        class="hidden"
      >
        <f7-icon ios="f7:plus" md="material:add"></f7-icon>
      </f7-fab>

      <KtpDetailFormPopover
        v-model:opened="isFormPopoverOpen"
        :target="formPopoverTarget"
        :parent-id="parentId"
        :detail-to-edit="editingDetail"
      />
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, watch, toRefs } from "vue";
import {
  f7Popup,
  f7Page,
  f7Navbar,
  f7NavTitle,
  f7NavRight,
  f7Link,
  f7Icon,
  f7Fab,
} from "framework7-vue";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import { storeToRefs } from "pinia";

const props = defineProps<{
  parentId: string | null;
  opened: boolean;
}>();

const emit = defineEmits(["update:opened"]);

const { parentId, opened } = toRefs(props);
const ktpStore = useKtpStore();
const { ktpDetails, loading } = storeToRefs(ktpStore);
const selectedDetailId = ref("ktp-detail-3");

const isFormPopoverOpen = ref(false);
const editingDetail = ref<KtpDetail | null>(null);
const formPopoverTarget = ref("");

const openAddPopover = () => {
  editingDetail.value = null;
  formPopoverTarget.value = "#add-ktp-detail-fab";
  isFormPopoverOpen.value = true;
};

const openEditPopover = (detail: KtpDetail) => {
  editingDetail.value = detail;
  selectedDetailId.value = detail.id;
  formPopoverTarget.value = `#ktp-detail-item-${detail.id}`;
  isFormPopoverOpen.value = true;
};

watch(parentId, (newParentId) => {
  if (newParentId) {
    ktpStore.fetchDetailsForParent(newParentId);
  }
});

watch(opened, (isOpened) => {
  if (isOpened && parentId.value) {
    ktpStore.fetchDetailsForParent(parentId.value);
  }
});
</script>

<style>
.popup.ktp-detail-popup {
  width: 90%;
  left: 50%;
  margin-left: -45%;
}
</style>
