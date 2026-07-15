import re

with open('src/pages/notifications.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Header
header_old = """          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-foreground">{{ notifications_title() }}</h1>"""
header_new = """          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
              {{ notifications_title() }}
              <span v-if="unreadNotifications.length" class="text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
                {{ unreadNotifications.length }} {{ t_unread }}
              </span>
            </h1>"""
content = content.replace(header_old, header_new)

# 2. Update format function in Reminder
reminder_old = """                  {{ notifications_deadline() }} {{ formatDate(reminder.deadline) }}"""
reminder_new = """                  {{ notifications_deadline() }} {{ formatHumanDate(reminder.deadline) }}"""
content = content.replace(reminder_old, reminder_new)

# 3. List
list_old = """        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification._id"
            class="bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md"
            :class="{
              'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20': notification.status === 'unread',
            }"
          >"""
list_new = """        <!-- Notifications List -->
        <div v-else class="space-y-6">
          <div v-if="newNotifications.length > 0" class="space-y-3">
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{{ t_new }}</h2>
            <div
              v-for="notification in newNotifications"
              :key="notification._id"
              class="relative bg-card rounded-lg border border-border overflow-hidden transition-all hover:shadow-md ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
            >
              <!-- Unread dot -->
              <div class="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>"""
# We also need earlierNotifications. Let's do it by regex or replacing the whole list block.
