/**
 * Makeup-hours request flow for the journal grid. Extracted from JournalTab.vue
 * (Cluster H).
 *
 * Fully self-contained side-effect cluster: no shared mutable state with the
 * rest of the grid. Reactive context (canonical column template, current event,
 * journal id) is passed in; stores are resolved internally.
 */
import { computed, type Ref } from "vue";
import { f7 } from "framework7-vue";
import { useMakeupRequestStore } from "@/stores/makeupRequestStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";
import type { MakeupHoursData } from "@/types/makeup-request";

export interface UseMakeupHoursOptions {
  canonicalTemplate: Ref<any[]>;
  currentEvent: Ref<any>;
  journalId: Ref<string>;
}

export function useMakeupHours(opts: UseMakeupHoursOptions) {
  const { canonicalTemplate, currentEvent, journalId } = opts;

  const makeupRequestStore = useMakeupRequestStore();
  const userStore = useUserStore();
  const teacherStore = useTeacherStore();

  const isMakeupRequestLoading = computed(() => makeupRequestStore.loading);

  const journalDatesForMakeup = computed(() =>
    (canonicalTemplate.value ?? [])
      .filter((m: any) => m.type === "date" && m.isoDate)
      .map((m: any) => ({
        isoDate: m.isoDate as string,
        label: String(m.label).replace("\n", " "),
      }))
  );

  const onMakeupHoursClick = () => {
    f7.popover.open("#makeup-hours-popover", "#journal-tools-button");
  };

  const onMakeupHoursSave = async (data: MakeupHoursData) => {
    const userId = userStore.currentUser?.id;
    if (!userId) {
      f7.dialog.alert("Пользователь не авторизован");
      return;
    }

    const eventTeacherId = currentEvent.value?.teacherId;
    if (!eventTeacherId) {
      f7.dialog.alert("Преподаватель не найден");
      return;
    }
    // event.teacherId may hold a teachers._id OR a users._id (depends who
    // created the event); the backend expects teachers._id. Resolve both forms.
    const teacherRecord =
      teacherStore.getTeacherById(eventTeacherId) ??
      teacherStore.getTeacherByUserId(eventTeacherId);
    const teacherId = teacherRecord?.id ?? eventTeacherId;

    try {
      await makeupRequestStore.createMakeupRequest({
        journalId: journalId.value,
        teacherId,
        createdBy: userId,
        reason: data.reason || undefined,
        dates: data.dates,
      });
      f7.toast
        .create({
          text: "Запрос на отработку часов отправлен на модерацию",
          position: "center",
          closeTimeout: 2500,
        })
        .open();
    } catch {
      f7.dialog.alert(
        makeupRequestStore.error ?? "Не удалось отправить запрос"
      );
    }
  };

  return {
    isMakeupRequestLoading,
    journalDatesForMakeup,
    onMakeupHoursClick,
    onMakeupHoursSave,
  };
}
