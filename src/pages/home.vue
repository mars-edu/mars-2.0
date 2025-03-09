<template>
  <f7-page name="home">
    <!-- Mobile Navbar - visible only on mobile -->
    <f7-navbar class="md:hidden">
      <f7-nav-left>
        <f7-link panel-open="left" class="flex items-center">
          <div
            class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl"
          >
            <span>M</span>
          </div>
          <span class="font-bold text-lg ml-2">Mars</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-right class="flex items-center">
        <f7-link icon-f7="bell" class="mx-2"></f7-link>
        <LanguageSelector
          :languages="availableLanguages"
          :active-language="activeLanguage"
          @change="handleLanguageChange"
          class="mx-2"
        />
        <f7-link class="mx-2">
          <img
            :src="avatarUrl"
            alt="User Avatar"
            class="w-10 h-10 rounded-full object-cover"
          />
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <!-- Desktop Header -->
    <DesktopHeader
      :avatar-url="avatarUrl"
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
      class="hidden md:block"
    />

    <div class="flex h-[calc(100vh-44px)] md:h-[calc(100vh-80px)]">
      <!-- Left Sidebar - always visible on desktop, hidden on mobile -->
      <div class="hidden md:block w-52 border-r border-gray-200 bg-white">
        <div class="py-4">
          <div
            v-for="item in navigationItems"
            :key="item.id"
            class="py-3 px-4 cursor-pointer flex items-center transition-colors"
            :class="{
              'bg-red-100 border-l-3 border-red-600': item.id === activeNavItem,
            }"
            @click="activeNavItem = item.id"
          >
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-100">
        <!-- Mars Banner -->
        <div
          class="h-36 bg-red-600 rounded-xl mb-5 flex items-center justify-center relative overflow-hidden shadow-md"
        >
          <div class="text-5xl font-bold text-white tracking-tight">Mars</div>
          <div class="absolute right-0 h-full w-2/5"></div>
        </div>

        <!-- Content Grid -->
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Left Column -->
          <div class="flex-1">
            <ActivityCard class="mb-4" />
            <AnnouncementsCard />
          </div>

          <!-- Right Column -->
          <div class="flex-1">
            <CalendarCard class="mb-4" />
            <ScheduleCard class="mb-4" />
            <AcademicWeekCard />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Tabbar -->
    <f7-toolbar tabbar labels position="bottom" class="md:hidden">
      <f7-link
        v-for="item in navigationItems"
        :key="item.id"
        :tab-link="'#tab-' + item.id"
        :tab-link-active="item.id === activeNavItem"
        :icon-f7="item.icon"
        :text="item.label"
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
} from "framework7-vue";
import DesktopHeader from "@/components/Header/DesktopHeader.vue";
import LanguageSelector from "@/components/LanguageSelector.vue";
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
