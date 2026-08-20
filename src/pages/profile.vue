<template>
  <f7-page
    name="profile"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden bg-background">
      <div
        class="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto no-scrollbar transition-all duration-200"
        :class="contentMargin"
      >
        <div
          class="flex flex-col w-full max-w-4xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-border bg-card overflow-hidden"
        >
          <div class="overflow-y-auto no-scrollbar">
          <!-- Concept Header Gradient -->
          <div class="h-48 bg-gradient-to-r from-gray-800 to-gray-900 relative">
            <div class="absolute -bottom-16 left-8">
              <div class="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                <div class="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="Profile Picture"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-4xl font-bold bg-muted text-muted-foreground">
                    {{ userStore.currentUser?.firstName?.[0] }}{{ userStore.currentUser?.lastName?.[0] }}
                  </div>
                </div>
                <!-- Mini edit button for avatar -->
                <button 
                  @click="selectImage"
                  class="absolute bottom-1 right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <IconCamera class="w-4 h-4" />
                </button>
                <!-- Mini delete button for avatar -->
                <button 
                  v-if="avatarUrl"
                  @click="removeAvatar"
                  class="absolute top-1 right-1 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Main Profile Content -->
          <div class="pt-20 px-8 pb-8">
            <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <h1 class="text-3xl font-bold text-foreground mb-2">
                  {{ userStore.currentUser?.lastName }} {{ userStore.currentUser?.firstName }} {{ userStore.currentUser?.middleName || '' }}
                </h1>
                <p class="text-lg text-muted-foreground font-medium">
                  {{ userStore.currentUser?.roles.join(', ') }}
                </p>
              </div>
              <div class="flex gap-2">
                <button 
                  @click="openEditPopup"
                  class="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-6 rounded-xl transition-colors text-sm"
                >
                  {{ common_edit() }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Left Column: Contact Info -->
              <div class="space-y-8">
                <h3 class="text-xl font-bold text-foreground mb-4">{{ profile_contact_info() }}</h3>
                
                <div class="space-y-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <IconMail class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ profile_email() }}</p>
                      <p class="font-medium text-foreground">{{ userStore.currentUser?.email || '—' }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <IconPhone class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ profile_phone() }}</p>
                      <p class="font-medium text-foreground">{{ userStore.currentUser?.phone || common_not_specified() }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <IconMapPin class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ profile_office() }}</p>
                      <p class="font-medium text-foreground">{{ userStore.currentUser?.office || common_not_specified() }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Academic Info -->
              <div class="space-y-8">
                <h3 class="text-xl font-bold text-foreground mb-4">{{ profile_academic_info() }}</h3>
                
                <div class="space-y-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <IconBriefcase class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ profile_department() }}</p>
                      <p class="font-medium text-foreground">{{ userStore.currentUser?.department || common_not_specified() }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-500">
                      <IconAward class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ profile_degree() }}</p>
                      <p class="font-medium text-emerald-600 dark:text-emerald-500">{{ userStore.currentUser?.degree || common_not_specified() }}</p>
                    </div>
                  </div>
                </div>
              </div>
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
          :title="profile_crop_image()"
          :cancel-text="common_cancel()"
          :on-cancel="cancelCrop"
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

        <PopoverFooter
          :save-text="common_save()"
          :is-loading="uploading"
          :on-cancel="cancelCrop"
          :on-save="handleCropAndUpload"
        />
      </div>
    </f7-popup>

    <!-- Edit Profile Popup -->
    <f7-popup
      :opened="showEditPopup"
      @popup:closed="showEditPopup = false"
      class="edit-profile-popup"
    >
      <div class="edit-profile-content bg-card text-card-foreground">
        <div class="fixed-header">
          <PopoverHeader
            :title="currentStep === 1 ? 'Основные данные' : 'Академические данные'"
            :cancel-text="common_cancel()"
            :on-cancel="() => showEditPopup = false"
          >
            <p class="text-sm text-muted-foreground mt-0.5">
              {{ currentStep === 1 ? 'Личная информация' : 'Профессиональная информация' }}
            </p>
            <div class="flex gap-1.5 mt-2.5">
              <div
                v-for="step in 2"
                :key="step"
                class="h-1 flex-1 rounded-full overflow-hidden bg-muted"
              >
                <div
                  class="h-full bg-primary transition-all duration-200"
                  :class="step <= currentStep ? 'w-full' : 'w-0'"
                />
              </div>
            </div>
          </PopoverHeader>
        </div>

        <div class="wizard-content p-4 space-y-5 flex-1 overflow-y-auto">
          <!-- Step 1: Basic Info -->
          <section v-if="currentStep === 1" class="space-y-4">
            <Input
              label="Имя"
              placeholder="Введите имя"
              v-model="editForm.firstName"
            />
            <Input
              label="Фамилия"
              placeholder="Введите фамилию"
              v-model="editForm.lastName"
            />
            <Input
              label="Отчество"
              placeholder="Введите отчество"
              v-model="editForm.middleName"
            />
            <Input
              label="Email"
              type="email"
              placeholder="example@mars.edu"
              v-model="editForm.email"
            />
            <Input
              label="Телефон"
              placeholder="+7 (___) ___-__-__"
              v-model="editForm.phone"
            />
          </section>

          <!-- Step 2: Academic Info -->
          <section v-if="currentStep === 2" class="space-y-4">
            <Input
              label="Кабинет"
              placeholder="Напр: 315"
              v-model="editForm.office"
            />
            <Input
              label="Кафедра"
              placeholder="Введите название кафедры"
              v-model="editForm.department"
            />
            <Input
              label="Степень"
              placeholder="Введите ученую степень"
              v-model="editForm.degree"
            />
          </section>
        </div>

        <PopoverFooter
          :cancel-text="currentStep === 1 ? common_cancel() : 'Назад'"
          :save-text="currentStep === 2 ? common_save() : 'Далее'"
          :on-cancel="currentStep === 1 ? () => showEditPopup = false : () => currentStep--"
          :on-save="currentStep === 2 ? handleSaveProfile : () => currentStep++"
        />
      </div>
    </f7-popup>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { f7Page, f7Button, f7Popup } from "framework7-vue";
import IconUser from "~icons/lucide/user";
import IconMail from "~icons/lucide/mail";
import IconPhone from "~icons/lucide/phone";
import IconMapPin from "~icons/lucide/map-pin";
import IconBriefcase from "~icons/lucide/briefcase";
import IconAward from "~icons/lucide/award";
import IconCamera from "~icons/lucide/camera";
import IconTrash from "~icons/lucide/trash-2";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconArrowLeft from "~icons/lucide/arrow-left";
import IconSettings from "~icons/lucide/settings";
import { useUserStore } from "../stores/userStore";
import { f7 } from "framework7-vue";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Input from "@/components/ui/Input.vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { useSidebar } from "@/composables/useSidebar";
import {
  profile_title,
  profile_change_photo,
  profile_upload_photo,
  profile_delete_photo,
  profile_email,
  profile_contact_info,
  profile_phone,
  profile_office,
  profile_academic_info,
  profile_department,
  profile_degree,
  profile_crop_image,
  profile_photo_updated,
  profile_photo_removed,
  profile_confirm_delete_photo,
  profile_not_image_error,
  profile_image_size_error,
  profile_process_error,
  profile_not_auth_error,
  profile_upload_error,
  profile_remove_error,
  common_cancel,
  common_save,
  common_not_specified,
  common_edit,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

console.log("[ProfilePage] Component setup initiated");

const { contentMargin } = useSidebar();

const activeNavItem = ref("profile");
const userStore = useUserStore();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const showCropperPopup = ref(false);
const showEditPopup = ref(false);
const selectedImageSrc = ref<string>("");
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

const currentStep = ref(1);
const editForm = reactive({
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  phone: "",
  office: "",
  department: "",
  degree: "",
});

const openEditPopup = () => {
  if (userStore.currentUser) {
    editForm.firstName = userStore.currentUser.firstName || "";
    editForm.lastName = userStore.currentUser.lastName || "";
    editForm.middleName = userStore.currentUser.middleName || "";
    editForm.email = userStore.currentUser.email || "";
    editForm.phone = userStore.currentUser.phone || "";
    editForm.office = userStore.currentUser.office || "";
    editForm.department = userStore.currentUser.department || "";
    editForm.degree = userStore.currentUser.degree || "";
  }
  currentStep.value = 1;
  showEditPopup.value = true;
};

const handleSaveProfile = async () => {
  if (!userStore.currentUser || !convex) return;

  f7.preloader.show();
  try {
    await convex.mutation(api.users.mutations.updateProfile, {
      userId: userStore.currentUser.id as Id<"users">,
      ...editForm,
    });

    await userStore.initialize();
    showEditPopup.value = false;

    f7.toast
      .create({
        text: "Профиль успешно обновлен",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  } catch (error: any) {
    console.error("[ProfilePage] Error updating profile:", error);
    f7.dialog.alert(error?.message || "Ошибка при обновлении профиля");
  } finally {
    f7.preloader.hide();
  }
};

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
    f7.dialog.alert(profile_not_image_error());
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    f7.dialog.alert(profile_image_size_error());
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
    f7.dialog.alert(profile_process_error());
    return;
  }

  // Convert canvas to blob
  canvas.toBlob(async (blob) => {
    if (!blob) {
      f7.dialog.alert(profile_process_error());
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
    f7.dialog.alert(profile_not_auth_error());
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
        text: profile_photo_updated(),
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  } catch (error: any) {
    console.error("[ProfilePage] Error uploading avatar:", error);
    f7.dialog.alert(
      error?.message || profile_upload_error()
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

  f7.dialog.confirm(profile_confirm_delete_photo(), async () => {
    f7.preloader.show();

    try {
      console.log("[ProfilePage] Removing profile picture");

      await convex.mutation(api.users.mutations.removeProfilePicture, {
        userId: userStore.currentUser!.id as Id<"users">,
      });

      console.log("[ProfilePage] Profile picture removed successfully");

      // Refresh user data
      await userStore.initialize();

      f7.toast
        .create({
          text: profile_photo_removed(),
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    } catch (error: any) {
      console.error("[ProfilePage] Error removing avatar:", error);
      f7.dialog.alert(
        error?.message || profile_remove_error()
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

.edit-profile-popup {
  --f7-popup-tablet-width: 540px;
  --f7-popup-tablet-height: 800px;
}

.edit-profile-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fixed-header {
  flex-shrink: 0;
}

.wizard-content {
  background: hsl(var(--background));
}

@media (min-width: 768px) {
  .edit-profile-popup {
    max-width: 540px;
    max-height: 800px;
    border-radius: 32px;
    overflow: hidden;
  }
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
