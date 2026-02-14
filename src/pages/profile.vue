<template>
  <f7-page
    name="profile"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Профиль</h1>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm space-y-6"
          >
            <!-- Avatar Row -->
            <div class="flex items-center gap-4 pb-6 border-b border-border">
              <div class="avatar-wrapper flex-shrink-0">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Profile Picture"
                  class="profile-avatar"
                />
                <div v-else class="profile-avatar-placeholder">
                  <i class="icon f7-icons">person_circle_fill</i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-lg font-semibold text-foreground truncate">
                  {{ userStore.currentUser?.firstName }} {{ userStore.currentUser?.lastName }}
                </p>
                <p class="text-sm text-muted-foreground truncate">{{ userStore.currentUser?.username }}</p>
                <div class="flex gap-2 mt-3 flex-wrap">
                  <f7-button fill small @click="selectImage">
                    {{ avatarUrl ? 'Изменить фото' : 'Загрузить фото' }}
                  </f7-button>
                  <f7-button
                    v-if="avatarUrl"
                    fill
                    small
                    color="red"
                    @click="removeAvatar"
                  >
                    Удалить фото
                  </f7-button>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileSelect"
              />
            </div>

            <!-- Personal Info Section -->
            <div>
              <h2 class="text-base font-semibold text-foreground mb-3">Личные данные</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="bg-muted rounded-lg p-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Имя</div>
                  <div class="text-sm font-medium text-foreground">{{ userStore.currentUser?.firstName || '—' }}</div>
                </div>
                <div class="bg-muted rounded-lg p-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Фамилия</div>
                  <div class="text-sm font-medium text-foreground">{{ userStore.currentUser?.lastName || '—' }}</div>
                </div>
                <div class="bg-muted rounded-lg p-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Email</div>
                  <div class="text-sm font-medium text-foreground">{{ userStore.currentUser?.email || '—' }}</div>
                </div>
                <div class="bg-muted rounded-lg p-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Имя пользователя</div>
                  <div class="text-sm font-medium text-foreground">{{ userStore.currentUser?.username || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- Security Section -->
            <div>
              <h2 class="text-base font-semibold text-foreground mb-3">Безопасность</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="bg-muted rounded-lg p-3">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Роли</div>
                  <div class="text-sm font-medium text-foreground">{{ userStore.currentUser?.roles.join(', ') || '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Cropper Popup -->
    <f7-popup
      :opened="showCropperPopup"
      @popup:closed="cancelCrop"
      class="cropper-popup"
    >
      <div class="cropper-popup-content">
        <PopoverHeader
          title="Обрезать изображение"
          cancel-text="Отмена"
          save-text="Сохранить"
          :is-loading="uploading"
          :on-cancel="cancelCrop"
          :on-save="handleCropAndUpload"
        />
        <div class="cropper-container">
          <Cropper
            ref="cropperRef"
            class="cropper"
            :src="selectedImageSrc"
            :stencil-props="{
              aspectRatio: 1,
            }"
            :stencil-component="CircleStencil"
            image-restriction="stencil"
          />
        </div>
      </div>
    </f7-popup>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7Page, f7Button, f7Popup } from "framework7-vue";
import { useUserStore } from "../stores/userStore";
import { f7 } from "framework7-vue";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

console.log("[ProfilePage] Component setup initiated");

const activeNavItem = ref("profile");
const userStore = useUserStore();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const showCropperPopup = ref(false);
const selectedImageSrc = ref<string>("");
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

const avatarUrl = computed(() => userStore.currentUser?.avatar);

const selectImage = () => {
  console.log("[ProfilePage] Opening file selector");
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    console.log("[ProfilePage] No file selected");
    return;
  }

  console.log("[ProfilePage] File selected:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (!file.type.startsWith("image/")) {
    f7.dialog.alert("Пожалуйста, выберите изображение");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    f7.dialog.alert("Размер изображения не должен превышать 5 МБ");
    return;
  }

  // Load image for cropping
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImageSrc.value = e.target?.result as string;
    showCropperPopup.value = true;
  };
  reader.readAsDataURL(file);
};

const handleCropAndUpload = async () => {
  if (!cropperRef.value) {
    console.error("[ProfilePage] Cropper ref not available");
    return;
  }

  const { canvas } = cropperRef.value.getResult();

  if (!canvas) {
    f7.dialog.alert("Не удалось обработать изображение");
    return;
  }

  // Convert canvas to blob
  canvas.toBlob(async (blob) => {
    if (!blob) {
      f7.dialog.alert("Не удалось обработать изображение");
      return;
    }

    // Create a File object from blob
    const croppedFile = new File([blob], "profile-picture.jpg", {
      type: "image/jpeg",
    });

    // Close the cropper popup
    showCropperPopup.value = false;
    selectedImageSrc.value = "";

    // Upload the cropped image
    await uploadAvatar(croppedFile);
  }, "image/jpeg", 0.9);
};

const cancelCrop = () => {
  showCropperPopup.value = false;
  selectedImageSrc.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const uploadAvatar = async (file: File) => {
  if (!userStore.currentUser || !convex) {
    console.error("[ProfilePage] User not authenticated or Convex not available");
    f7.dialog.alert("Ошибка: пользователь не авторизован");
    return;
  }

  uploading.value = true;
  f7.preloader.show();

  try {
    console.log("[ProfilePage] Uploading file to Convex storage");

    // Step 1: Generate upload URL
    const uploadUrl = await convex.mutation(api.files.mutations.generateUploadUrl);
    console.log("[ProfilePage] Upload URL generated");

    // Step 2: Upload file to storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    const { storageId } = await uploadResponse.json();
    console.log("[ProfilePage] File uploaded, storage ID:", storageId);
    console.log("[ProfilePage] Current user ID:", userStore.currentUser.id);

    // Step 3: Store file metadata
    await convex.mutation(api.files.mutations.storeFileMetadata, {
      storageId,
      name: file.name,
      contentType: file.type,
      size: file.size,
      key: `avatar-${userStore.currentUser.id}-${Date.now()}`,
    });

    // Step 4: Update user profile with new avatar
    // Capture userId as a string to avoid Vue reactivity proxy issues
    const userId = String(userStore.currentUser.id);
    console.log("[ProfilePage] Calling uploadProfilePicture with userId:", userId);
    console.log("[ProfilePage] storageId:", storageId);

    const result = await convex.action(api.users.mutations.uploadProfilePicture, {
      userId: userId,
      storageId: storageId,
    });

    console.log("[ProfilePage] Upload result:", result);

    console.log("[ProfilePage] Profile picture updated successfully");

    // Refresh user data
    await userStore.initialize();

    f7.toast
      .create({
        text: "Фото профиля обновлено",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  } catch (error: any) {
    console.error("[ProfilePage] Error uploading avatar:", error);
    f7.dialog.alert(
      error?.message || "Ошибка при загрузке фото. Попробуйте еще раз."
    );
  } finally {
    uploading.value = false;
    f7.preloader.hide();
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

const removeAvatar = async () => {
  if (!userStore.currentUser || !convex) {
    return;
  }

  f7.dialog.confirm("Вы уверены, что хотите удалить фото профиля?", async () => {
    f7.preloader.show();

    try {
      console.log("[ProfilePage] Removing profile picture");

      await convex.mutation(api.users.mutations.removeProfilePicture, {
        userId: userStore.currentUser!.id as any,
      });

      console.log("[ProfilePage] Profile picture removed successfully");

      // Refresh user data
      await userStore.initialize();

      f7.toast
        .create({
          text: "Фото профиля удалено",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    } catch (error: any) {
      console.error("[ProfilePage] Error removing avatar:", error);
      f7.dialog.alert(
        error?.message || "Ошибка при удалении фото. Попробуйте еще раз."
      );
    } finally {
      f7.preloader.hide();
    }
  });
};

onMounted(() => {
  console.log("[ProfilePage] Component mounted");
});
</script>

<style scoped>
.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 3px solid hsl(var(--border));
  flex-shrink: 0;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted));
}

.profile-avatar-placeholder .icon {
  font-size: 40px;
  color: hsl(var(--muted-foreground));
  opacity: 0.4;
}

/* Cropper Popup Styles */
.cropper-popup {
  --f7-popup-tablet-width: 95%;
  --f7-popup-tablet-height: 95%;
}

.cropper-popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: hsl(var(--card));
}

.cropper-container {
  flex: 1;
  width: 100%;
  padding: 24px;
  background: hsl(var(--background));
  overflow: hidden;
}

.cropper {
  height: 100%;
  width: 100%;
  background: hsl(var(--muted));
}

@media (min-width: 768px) {
  .cropper-popup {
    --f7-popup-tablet-width: 90%;
    --f7-popup-tablet-height: 90%;
    max-width: 1000px;
    max-height: 800px;
  }

  .cropper-container {
    padding: 32px;
  }
}

@media (min-width: 1024px) {
  .cropper-popup {
    --f7-popup-tablet-width: 85%;
    --f7-popup-tablet-height: 85%;
  }
}
</style>
