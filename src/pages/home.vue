<template>
  <f7-page name="home">
    <Header
      :avatar-url="avatarUrl"
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
      class="hidden md:block"
    />

    <!-- Desktop Layout -->
    <div class="hidden md:flex h-full">
      <!-- Left Sidebar - always visible on desktop -->
      <Sidebar
        :navigation-items="navigationItems"
        :active-nav-item="activeNavItem"
        @update:active-nav-item="activeNavItem = $event"
      />

      <!-- Main Content Area for Desktop -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div class="flex flex-row gap-4">
          <div class="flex-1 space-y-4 min-w-[60%]">
            <Doodle size="large">
              <Nauryz />
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
        <div class="overflow-y-auto p-4 bg-gray-100 pb-16">
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
        <div class="overflow-y-auto p-4 bg-gray-100 pb-16">
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
        <div class="overflow-y-auto p-4 bg-gray-100 pb-16">
          <h2 class="text-2xl font-bold mb-4">Журналы</h2>
          <!-- Journal content here -->
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-gray-500">Содержимое журналов будет здесь</p>
          </div>
        </div>
      </f7-tab>

      <!-- RUP Tab -->
      <f7-tab
        id="tab-rup"
        class="page-content"
        :tab-active="activeNavItem === 'rup'"
      >
        <div class="overflow-y-auto p-4 bg-gray-100 pb-16">
          <h2 class="text-2xl font-bold mb-4">РУП</h2>
          <!-- RUP content here -->
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-gray-500">Содержимое РУП будет здесь</p>
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

    <!-- Left Panel with User Profile - for mobile -->
    <f7-panel left cover class="md:hidden">
      <f7-page>
        <f7-navbar title="Профиль"></f7-navbar>
        <f7-block class="text-center">
          <div
            class="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-red-600"
          >
            <img
              :src="avatarUrl"
              alt="User Avatar"
              class="w-full h-full object-cover"
            />
          </div>
          <h2 class="text-xl font-semibold">{{ userName }}</h2>
          <p class="text-gray-600">{{ userRole }}</p>
        </f7-block>
        <f7-list>
          <f7-list-item
            v-for="item in profileMenuItems"
            :key="item.id"
            :link="item.link"
            :title="item.title"
            :icon-f7="item.icon"
          ></f7-list-item>
        </f7-list>
      </f7-page>
    </f7-panel>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
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
import Nauryz from "@/components/Doodle/components/Nauryz.vue";
import ActivityCard from "@/components/Cards/ActivityCard.vue";
import AnnouncementsCard from "@/components/Cards/AnnouncementsCard.vue";
import CalendarCard from "@/components/Cards/CalendarCard.vue";
import ScheduleCard from "@/components/Cards/ScheduleCard.vue";
import AcademicWeekCard from "@/components/Cards/AcademicWeekCard.vue";
import { useLanguage } from "@/composables/useLanguage";

// State
const searchbarEnabled = ref(false);
const activeNavItem = ref("home");
const userName = ref("Имя Пользователя");
const userRole = ref("Студент");
const avatarUrl = ref(
  "https://ui-avatars.com/api/?name=User+Name&background=e53935&color=fff"
);

// Navigation items
const navigationItems = [
  { id: "home", label: "Главная", icon: "house_fill" },
  { id: "schedule", label: "Расписание", icon: "calendar" },
  { id: "journals", label: "Журналы", icon: "doc_text_fill" },
  { id: "rup", label: "РУП", icon: "book_fill" },
];

// Profile menu items
const profileMenuItems = [
  { id: "settings", title: "Настройки", icon: "gear", link: "#" },
  { id: "help", title: "Помощь", icon: "question_circle", link: "#" },
  { id: "logout", title: "Выйти", icon: "square_arrow_right", link: "#" },
];

// Language management
const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

// Event handlers
const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleLanguageChange = (code: string) => {
  setLanguage(code);
};
</script>
