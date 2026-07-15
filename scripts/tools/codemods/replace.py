import re

with open('src/pages/notifications.vue', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
import_block = """import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { useConvexQuery, useConvexMutation } from 'convex-vue';"""
new_import_block = """import { formatDateTime, formatDate } from '@/utils/dateUtils';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";
import "dayjs/locale/kk";
dayjs.extend(relativeTime);
import { useConvexQuery, useConvexMutation } from 'convex-vue';"""
text = text.replace(import_block, new_import_block)

# 2. Add computed properties
init_block = """const { locale } = useI18n();
const { contentMargin } = useSidebar();
const userStore = useUserStore();"""
new_init_block = """const { locale } = useI18n();
const { contentMargin } = useSidebar();
const userStore = useUserStore();

const t_new = computed(() => locale.value === 'kk' ? 'Жаңа' : locale.value === 'en' ? 'New' : 'Новые');
const t_earlier = computed(() => locale.value === 'kk' ? 'Бұрынғы' : locale.value === 'en' ? 'Earlier' : 'Ранее');
const t_unread = computed(() => locale.value === 'kk' ? 'оқылмаған' : locale.value === 'en' ? 'unread' : 'непрочитанных');

const formatRelativeTime = (timestamp: number) => {
  return dayjs(timestamp).locale(locale.value).fromNow();
};

const formatHumanDate = (dateString: string | number) => {
  return dayjs(dateString).locale(locale.value).format("D MMMM YYYY");
};"""
text = text.replace(init_block, new_init_block)

# 3. Add earlierNotifications
unread_block = """const unreadNotifications = computed(() =>
  notifications.value.filter((n: any) => n.status === 'unread')
);"""
new_unread_block = """const unreadNotifications = computed(() =>
  notifications.value.filter((n: any) => n.status === 'unread')
);

const newNotifications = computed(() => notifications.value.filter((n: any) => n.status === 'unread'));
const earlierNotifications = computed(() => notifications.value.filter((n: any) => n.status !== 'unread'));"""
text = text.replace(unread_block, new_unread_block)

# 4. Header title badge
header_old = """<h1 class="text-3xl font-bold text-foreground">{{ notifications_title() }}</h1>"""
header_new = """<h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
              {{ notifications_title() }}
              <span v-if="unreadNotifications.length" class="text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
                {{ unreadNotifications.length }} {{ t_unread }}
              </span>
            </h1>"""
text = text.replace(header_old, header_new)

# 5. Format reminder
text = text.replace('{{ formatDate(reminder.deadline) }}', '{{ formatHumanDate(reminder.deadline) }}')


notification_item = """
            <!-- Substitution Notification -->
            <div v-if="notification.type === 'substitution'" class="p-4 pt-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <IconRefreshCw class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-foreground mb-1">{{ notification.title }}</h3>
                    <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                  </div>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {{ formatRelativeTime(notification.createdAt) }}
                </span>
              </div>

              <!-- Substitution Actions -->
              <div
                v-if="isAdmin && notification.substitution && notification.substitution.status === 'pending'"
                class="flex gap-2 mt-3 pt-3 border-t border-border"
              >
                <button
                  @click="handleAcceptSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_accept() }}
                </button>
                <button
                  @click="handleRejectSubstitution(notification.substitution._id, notification._id)"
                  :disabled="processing"
                  class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {{ notifications_reject() }}
                </button>
              </div>

              <!-- Substitution Status -->
              <div
                v-else-if="notification.substitution"
                class="mt-3 pt-3 border-t border-border flex items-center"
              >
                <span
                  v-if="notification.substitution.status === 'accepted'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-sm font-medium border border-green-200 dark:border-green-800"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_accepted() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800"
                >
                  <IconCircleX class="w-4 h-4" />
                  {{ notifications_rejected() }}
                </span>
                <span
                  v-else-if="notification.substitution.status === 'completed'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700"
                >
                  <IconCircleCheck class="w-4 h-4" />
                  {{ notifications_completed() }}
                </span>
              </div>
            </div>

            <!-- Journal Closure Notification -->
            <div v-else-if="notification.type === 'journal_closure'" class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <IconCalendarX class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-orange-600 dark:text-orange-400">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-foreground mb-2">{{ notification.message }}</p>
                  <p
                    v-if="notification.metadata?.deadline"
                    class="text-xs text-muted-foreground"
                  >
                    {{ notifications_deadline() }} {{ formatHumanDate(notification.metadata.deadline) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- System Notification -->
            <div v-else class="p-4 pt-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <IconInfo class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-semibold text-foreground">{{ notification.title }}</h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ notification.message }}</p>
                </div>
              </div>
            </div>
"""

list_block = """        <!-- Notifications List -->
        <div v-else class="space-y-6">
          <div v-if="newNotifications.length > 0" class="space-y-3">
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{{ t_new }}</h2>
            <div
              v-for="notification in newNotifications"
              :key="notification._id"
              class="relative bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
            >
              <!-- Unread dot -->
              <div class="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
""" + notification_item + """          </div>
          </div>

          <div v-if="earlierNotifications.length > 0" class="space-y-3">
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{{ t_earlier }}</h2>
            <div
              v-for="notification in earlierNotifications"
              :key="notification._id"
              class="relative bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md"
            >
""" + notification_item + """          </div>
          </div>
        </div>"""


old_list_regex = r'<!-- Notifications List -->.*?</div>\n        </div>\n      </div>\n    </div>'

text = re.sub(old_list_regex, list_block + '\n      </div>\n    </div>', text, flags=re.DOTALL)

with open('src/pages/notifications.vue', 'w', encoding='utf-8') as f:
    f.write(text)

