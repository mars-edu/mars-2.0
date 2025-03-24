<template>
  <div class="desktop-header desktop-only">
    <Logo class="header-left" />
    <div class="header-center">
      <SearchBar
        @enable="emit('searchbar-enable')"
        @disable="emit('searchbar-disable')"
      />
    </div>
    <div class="header-right">
      <f7-link class="notification-icon" icon-f7="bell"></f7-link>
      <ThemeToggle class="theme-toggle" />
      <LanguageSelector
        :languages="availableLanguages"
        :active-language="activeLanguage"
        :theme="themeStore.currentTheme"
        @change="handleLanguageChange"
        class="language-selector"
      />
      <div class="avatar-container">
        <img
          :src="rasulZhangeldinovichProfile"
          alt="User Avatar"
          class="user-avatar"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";
import SearchBar from "../SearchBar.vue";
import LanguageSelector from "../LanguageSelector.vue";
import rasulZhangeldinovichProfile from "@/assets/rassul-zh-profile.jpg";
import Logo from "../Logo/Logo.vue";
import ThemeToggle from "../ThemeToggle.vue";
import { useLanguage } from "@/composables/useLanguage.ts";
import { useThemeStore } from "@/stores/themeStore";

const themeStore = useThemeStore();

const emit = defineEmits<{
  (e: "searchbar-enable"): void;
  (e: "searchbar-disable"): void;
  (e: "language-change", lang: string): void;
}>();

const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

const handleLanguageChange = (code: string) => {
  setLanguage(code);
  emit("language-change", code);
};
</script>
<style scoped>
.desktop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  height: 80px;
  border-bottom: 1px solid var(--border-color);
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-center {
  position: relative;
  flex: 1;
  padding: 0 40px;
  margin: 0 auto;
  max-width: 600px;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.notification-icon {
  color: #e53935;
  font-size: 22px;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.notification-icon:hover {
  background-color: rgba(229, 57, 53, 0.1);
}

.language-selector {
  margin: 0 8px;
}

.theme-toggle {
  margin: 0 8px;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.avatar-container:hover .user-avatar {
  border-color: #e53935;
}
</style>
