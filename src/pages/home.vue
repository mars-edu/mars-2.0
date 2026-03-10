<template>
  <f7-page
    name="home"
    class="flex flex-col h-screen"
    :data-page-id="`home-${pageId}`"
    data-page-name="home"
  >
    <Header class="hidden md:block flex-shrink-0" />

    <!-- Desktop Layout -->
    <div class="hidden md:flex overflow-hidden flex-1">
      <Sidebar v-model:activeNavItem="activeNavItem" />

      <div
        class="flex-1 overflow-y-auto p-6 bg-background text-foreground transition-all duration-200"
        :class="contentMargin"
      >
        <WelcomeSection />
        <StatsRow />

        <div class="flex flex-col xl:flex-row gap-6">
          <!-- Left: Activity + QuickActions + Announcements -->
          <div class="flex-1 space-y-6 min-w-0">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2">
                <ActivityCard />
              </div>
              <QuickActionsCard />
            </div>
            <AnnouncementsCard />
          </div>

          <!-- Right: Calendar + Schedule panel -->
          <div class="w-full xl:w-[380px] xl:flex-shrink-0">
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
          <StatsRow />
          <div class="flex flex-col gap-4">
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
          <h2 class="text-2xl font-bold mb-4">Расписание</h2>
          <CalendarSchedulePanel class="min-h-[600px]" />
        </div>
      </f7-tab>

      <f7-tab
        id="tab-journals"
        class="page-content"
        :tab-active="activeNavItem === 'journals'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">Журналы</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">Содержимое журналов будет здесь</p>
          </div>
        </div>
      </f7-tab>

      <f7-tab
        id="tab-rup"
        class="page-content"
        :tab-active="activeNavItem === 'rup'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">РУП</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">Содержимое РУП будет здесь</p>
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
        :icon-f7="item.icon"
        :text="item.label"
        @click="activeNavItem = item.id"
      ></f7-link>
    </f7-toolbar>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
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

const { contentMargin } = useSidebar();
const pageId = ref(Date.now());
const activeNavItem = ref("home");

const navigationItems = [
  { id: "home", label: "Главная", icon: "house_fill" },
  { id: "schedule", label: "Расписание", icon: "calendar" },
  { id: "journals", label: "Журналы", icon: "doc_text_fill" },
  { id: "rup", label: "РУП", icon: "book_fill" },
];
</script>
