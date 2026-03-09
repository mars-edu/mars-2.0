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
      <!-- Left Sidebar - always visible on desktop -->
      <Sidebar v-model:activeNavItem="activeNavItem" />

      <!-- Main Content Area for Desktop -->
      <div
        class="flex-1 overflow-y-auto p-4 bg-background text-foreground transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-row gap-4">
          <div class="flex-1 space-y-4 min-w-[60%]">
            <Doodle size="large">
              <Quote />
            </Doodle>
            <AcademicWeekCard />
            <ActivityCard />
            <AnnouncementsCard />
          </div>

          <div class="flex-1 space-y-4">
            <CalendarCard />
            <ScheduleCard />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout with Tabs -->
    <f7-tabs class="md:hidden">
      <!-- Home Tab -->
      <f7-tab
        id="tab-home"
        class="page-content"
        :tab-active="activeNavItem === 'home'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <!-- Mars Banner -->
          <Doodle size="large" class="mb-4" />

          <!-- Content Grid for Mobile -->
          <div class="flex flex-col gap-4">
            <ActivityCard class="mb-3" />
            <AnnouncementsCard class="mb-3" />
            <CalendarCard class="mb-3" />
            <ScheduleCard class="mb-3" />
            <AcademicWeekCard />
          </div>
        </div>
      </f7-tab>

      <!-- Schedule Tab -->
      <f7-tab
        id="tab-schedule"
        class="page-content"
        :tab-active="activeNavItem === 'schedule'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">Расписание</h2>
          <CalendarCard class="mb-4" />
          <ScheduleCard />
        </div>
      </f7-tab>

      <!-- Journals Tab -->
      <f7-tab
        id="tab-journals"
        class="page-content"
        :tab-active="activeNavItem === 'journals'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">Журналы</h2>
          <!-- Journal content here -->
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">Содержимое журналов будет здесь</p>
          </div>
        </div>
      </f7-tab>

      <!-- RUP Tab -->
      <f7-tab
        id="tab-rup"
        class="page-content"
        :tab-active="activeNavItem === 'rup'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">РУП</h2>
          <!-- RUP content here -->
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
import { ref, onMounted } from "vue";
import {
  f7Navbar,
  f7Page,
  f7Link,
  f7Toolbar,
  f7Panel,
  f7Block,
  f7List,
  f7ListItem,
  f7NavLeft,
  f7NavRight,
  f7Tabs,
  f7Tab,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Doodle from "@/components/Doodle/Doodle.vue";
import Quote from "@/components/Doodle/components/Quote.vue";
import ActivityCard from "@/components/Cards/ActivityCard.vue";
import AnnouncementsCard from "@/components/Cards/AnnouncementsCard.vue";
import CalendarCard from "@/components/Cards/CalendarCard.vue";
import ScheduleCard from "@/components/Cards/ScheduleCard.vue";
import AcademicWeekCard from "@/components/Cards/AcademicWeekCard.vue";
import { useSidebar } from "@/composables/useSidebar";

console.log("[HomePage] Component setup initiated");

const { contentMargin } = useSidebar();

// Unique page ID that changes on each mount to track navigation
const pageId = ref(Date.now());

const activeNavItem = ref("home");

onMounted(() => {
  console.log("[HomePage] Component mounted");
  console.log("[HomePage] Active navigation item:", activeNavItem.value);
  console.log("[HomePage] Navigation items configured:", navigationItems);
});

const navigationItems = [
  { id: "home", label: "Главная", icon: "house_fill" },
  { id: "schedule", label: "Расписание", icon: "calendar" },
  { id: "journals", label: "Журналы", icon: "doc_text_fill" },
  { id: "rup", label: "РУП", icon: "book_fill" },
];
</script>
