<template>
  <f7-page
    name="settings"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";

const activeNavItem = ref("settings");
</script>
