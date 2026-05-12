<template>
  <f7-page
    name="home"
    class="flex flex-col h-screen"
    :data-page-id="`home-${pageId}`"
    data-page-name="home"
  >
    <Header class="hidden md:block flex-shrink-0" />

    <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

    <!-- Desktop Layout -->
    <div class="hidden md:flex overflow-hidden flex-1 bg-background">
      <div
        class="flex-1 flex flex-col min-w-0 overflow-hidden"
        :class="contentMargin"
      >
        <div class="flex-1 flex gap-6 p-6 text-foreground transition-all duration-200 overflow-hidden">
          <!-- Left: Welcome + Stats + Activity + QuickActions + Announcements -->
          <div class="flex-1 flex flex-col overflow-y-auto pr-2 no-scrollbar space-y-8">
            <WelcomeSection />
            <StatsRow />

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div class="lg:col-span-2 h-full">
                <ActivityCard class="h-full" />
              </div>
              <div class="h-full">
                <QuickActionsCard class="h-full" />
              </div>
            </div>
            <AnnouncementsCard />
          </div>

          <!-- Right: Calendar + Schedule panel -->
          <div class="w-[400px] flex-shrink-0 h-full overflow-hidden">
            <CalendarSchedulePanel />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout with Tabs -->
    <f7-tabs class="md:hidden">
      <f7-tab
        id="tab-home"
        class="page-content"
        :tab-active="activeNavItem === 'home'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <WelcomeSection />
          <div class="flex flex-col gap-4">
            <StatsRow />
            <ActivityCard />
            <AnnouncementsCard />
            <CalendarSchedulePanel class="min-h-[600px]" />
          </div>
        </div>
      </f7-tab>

      <f7-tab
        id="tab-schedule"
        class="page-content"
        :tab-active="activeNavItem === 'schedule'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">{{ home_schedule() }}</h2>
          <CalendarSchedulePanel class="min-h-[600px]" />
        </div>
      </f7-tab>

      <f7-tab
        id="tab-journals"
        class="page-content"
        :tab-active="activeNavItem === 'journals'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">{{ home_journals() }}</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">{{ home_journals_placeholder() }}</p>
          </div>
        </div>
      </f7-tab>

      <f7-tab
        id="tab-rup"
        class="page-content"
        :tab-active="activeNavItem === 'rup'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">{{ home_rup() }}</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">{{ home_rup_placeholder() }}</p>
          </div>
        </div>
      </f7-tab>
    </f7-tabs>

    <!-- Mobile Tabbar -->
    <f7-toolbar tabbar labels position="bottom" class="md:hidden">
      <f7-link
        v-for="item in navigationItems"
        :key="item.id"
        :tab-link="'#tab-' + item.id"
        :tab-link-active="item.id === activeNavItem"
        @click="activeNavItem = item.id"
      >
        <component :is="item.icon" class="icon" />
        <span class="tabbar-label">{{ item.label }}</span>
      </f7-link>
    </f7-toolbar>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7Page, f7Link, f7Toolbar, f7Tabs, f7Tab } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import ActivityCard from "@/components/Cards/ActivityCard.vue";
import AnnouncementsCard from "@/components/Cards/AnnouncementsCard.vue";
import WelcomeSection from "@/components/Home/WelcomeSection.vue";
import StatsRow from "@/components/Home/StatsRow.vue";
import QuickActionsCard from "@/components/Home/QuickActionsCard.vue";
import CalendarSchedulePanel from "@/components/Home/CalendarSchedulePanel.vue";
import { useSidebar } from "@/composables/useSidebar";
import IconHouse from "~icons/lucide/house";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconBook from "~icons/lucide/book";
import {
  home_home,
  home_schedule,
  home_journals,
  home_rup,
  home_journals_placeholder,
  home_rup_placeholder,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const pageId = ref(Date.now());
const activeNavItem = ref("home");

const navigationItems = computed(() => {
  // Explicit dependency on locale.value ensures reactivity
  locale.value;
  return [
    { id: "home", label: home_home(), icon: IconHouse },
    { id: "schedule", label: home_schedule(), icon: IconCalendar },
    { id: "journals", label: home_journals(), icon: IconBook },
    { id: "rup", label: home_rup(), icon: IconFileText },
  ];
});
</script>
