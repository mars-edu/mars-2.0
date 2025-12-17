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
            class="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm"
          >
            <div class="profile-container">
              <div class="profile-avatar-section">
                <div class="avatar-wrapper">
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
                <div class="avatar-actions">
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
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
              </div>

              <div class="profile-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Имя</span>
                    <span class="info-value">{{ userStore.currentUser?.firstName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Фамилия</span>
                    <span class="info-value">{{ userStore.currentUser?.lastName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ userStore.currentUser?.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Имя пользователя</span>
                    <span class="info-value">{{ userStore.currentUser?.username }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Роли</span>
                    <span class="info-value">{{ userStore.currentUser?.roles.join(', ') }}</span>
                  </div>
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
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid hsl(var(--border));
}

.avatar-wrapper {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 3px solid hsl(var(--border));
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
  font-size: 80px;
  color: hsl(var(--muted-foreground));
  opacity: 0.4;
}

.avatar-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.profile-info {
  width: 100%;
}

.info-grid {
  display: grid;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  font-weight: 400;
  color: hsl(var(--foreground));
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-avatar-section {
    padding: 32px 0;
  }
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
