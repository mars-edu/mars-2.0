<template>
  <f7-page
    name="home"
    class="flex flex-col h-screen"
    :data-page-id="`home-${pageId}`"
    data-page-name="home"
  >
    <Header class="hidden md:block flex-shrink-0" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

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

    <!-- Mobile Layout -->
    <div class="md:hidden overflow-y-auto p-4 bg-background text-foreground mobile-content-area">
      <WelcomeSection />
      <div class="flex flex-col gap-4">
        <StatsRow />
        <ActivityCard />
        <AnnouncementsCard />
        <CalendarSchedulePanel class="min-h-[600px]" />
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7Page } from "framework7-vue";
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
</script>
