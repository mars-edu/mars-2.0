<template>
  <f7-popup
    id="add-announcement-popup"
    :opened="opened"
    @popup:closed="$emit('update:opened', false)"
    class="rounded-3xl"
  >
    <f7-page>
      <f7-navbar :title="m.home_announcements_modal_title()">
        <f7-nav-right>
          <f7-link popup-close>{{ m.common_close() }}</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="p-6 space-y-6">
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">{{ m.home_announcements_modal_field_title() }}</label>
          <f7-input
            type="text"
            :placeholder="m.home_announcements_modal_placeholder_title()"
            v-model:value="form.title"
            class="bg-muted rounded-xl px-4 py-1"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">{{ m.common_date() }}</label>
            <f7-input
              type="text"
              :placeholder="m.home_announcements_modal_placeholder_date()"
              v-model:value="form.date"
              class="bg-muted rounded-xl px-4 py-1"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">{{ m.common_category() }}</label>
            <f7-list dropdown class="m-0 bg-muted rounded-xl">
              <f7-list-item
                :title="m.common_category()"
                smart-select
                :smart-select-params="{ openIn: 'popover' }"
              >
                <select v-model="form.category">
                  <option value="academic">{{ m.home_announcements_filter_academic() }}</option>
                  <option value="contests">{{ m.home_announcements_filter_contests() }}</option>
                  <option value="events">{{ m.home_announcements_filter_events() }}</option>
                  <option value="other">{{ m.common_other() }}</option>
                </select>
              </f7-list-item>
            </f7-list>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">{{ m.home_announcements_modal_field_type() }}</label>
          <div class="flex bg-muted p-1 rounded-xl">
            <button
              v-for="t in types"
              :key="t.id"
              type="button"
              @click="form.type = t.id"
              class="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all"
              :class="form.type === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase mb-1">{{ m.common_description() }}</label>
          <f7-input
            type="textarea"
            :placeholder="m.home_announcements_modal_placeholder_description()"
            v-model:value="form.description"
            class="bg-muted rounded-xl px-4 py-1 h-32"
            resizable
          />
        </div>

        <f7-button
          large
          fill
          class="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg"
          :disabled="!form.title || !form.description"
          @click="handleSubmit"
        >
          {{ m.home_announcements_modal_submit() }}
        </f7-button>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { f7Popup, f7Page, f7Navbar, f7NavRight, f7Link, f7Input, f7Button, f7List, f7ListItem } from 'framework7-vue';
import * as m from '@/paraglide/messages';

const props = defineProps<{
  opened: boolean;
}>();

const emit = defineEmits(['update:opened', 'add']);

const types = computed(() => [
  { id: 'info', label: m.home_announcements_badge_info() },
  { id: 'alert', label: m.home_announcements_badge_alert() },
  { id: 'system', label: m.home_announcements_badge_system() },
]);

const form = reactive({
  title: '',
  date: '',
  category: 'academic',
  type: 'info',
  description: '',
});

const handleSubmit = () => {
  emit('add', { ...form, id: Date.now() });
  emit('update:opened', false);
  // Reset form
  form.title = '';
  form.date = '';
  form.category = 'academic';
  form.type = 'info';
  form.description = '';
};
</script>
