<template>
  <Card title="Ваша активность">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-muted rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Посещаемость</div>
          <div class="mt-1 flex items-baseline">
            <div class="text-2xl font-semibold text-foreground">94%</div>
            <div class="ml-2 text-sm text-green-500">+2.3%</div>
          </div>
        </div>
        <div class="bg-muted rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Средний балл</div>
          <div class="mt-1 flex items-baseline">
            <div class="text-2xl font-semibold text-foreground">???</div>
            <div class="ml-2 text-sm text-green-500">+32</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from "@/components/ui/Card.vue";

interface Props {
  /** @deprecated Theme is now handled by CSS custom properties. */
  theme?: "white" | "dark" | "lavanda";
}

withDefaults(defineProps<Props>(), {
  theme: "white",
});
</script>
