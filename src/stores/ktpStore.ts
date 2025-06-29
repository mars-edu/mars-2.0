import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface KtpDetail {
  id: string;
  parentId: string;
  position: number;
  theme: string;
  totalHours: number | null;
  srsp: number | null;
  srs: number | null;
  homework: string;
}

const mockData: KtpDetail[] = [
  {
    id: "ktp-detail-1",
    parentId: "mock-class9-id-1",
    position: 1,
    theme: "Формирование полиэтнического общества в советский период.",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  {
    id: "ktp-detail-2",
    parentId: "mock-class9-id-1",
    position: 2,
    theme: "Миграционная политика Республики Казахстан.",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  {
    id: "ktp-detail-3",
    parentId: "mock-class9-id-1",
    position: 3,
    theme:
      "Казахстанская модель межэтнического и межконфессионального согласия. Роль Ассамблеи народа Казахстана в общественно-политической и культурной жизни Казахстана.",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  {
    id: "ktp-detail-4",
    parentId: "mock-class9-id-1",
    position: 4,
    theme: "Исследовательская работа: Этносы Казахстана: история и судьбы",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  {
    id: "ktp-detail-5",
    parentId: "mock-class9-id-1",
    position: 5,
    theme:
      "Истоки и развитие общественно-политической мысли в период Казахского ханства.",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  {
    id: "ktp-detail-6",
    parentId: "mock-class9-id-1",
    position: 6,
    theme:
      'Идеологические ценности представителей течения "Зарзаман". Общественно-политические взгляды казахских просветителей XIX века.',
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `ktp-detail-${i + 7}`,
    parentId: "mock-class9-id-1",
    position: i + 7,
    theme: "",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  })),
];

function createEmptyKtpDetail(parentId: string, position: number): KtpDetail {
  return {
    id: crypto.randomUUID(),
    parentId,
    position,
    theme: "",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
  };
}

export const useKtpStore = defineStore(
  "ktp",
  () => {
    const ktpDetails = ref<KtpDetail[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    function fetchDetailsForParent(parentId: string) {
      loading.value = true;
      setTimeout(() => {
        ktpDetails.value = mockData
          .filter((d) => d.parentId === "mock-class9-id-1")
          .sort((a, b) => a.position - b.position);
        loading.value = false;
      }, 300);
    }

    function addKtpDetail(
      parentId: string,
      data: Partial<Omit<KtpDetail, "id" | "parentId" | "position">>
    ) {
      const newPosition = ktpDetails.value.length + 1;
      const newItem = {
        ...createEmptyKtpDetail(parentId, newPosition),
        ...data,
      };
      ktpDetails.value.push(newItem);
    }

    function updateKtpDetail(
      id: string,
      data: Partial<Omit<KtpDetail, "id" | "parentId">>
    ) {
      const index = ktpDetails.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        ktpDetails.value[index] = { ...ktpDetails.value[index], ...data };
      }
    }

    function deleteKtpDetail(id: string) {
      ktpDetails.value = ktpDetails.value.filter((d) => d.id !== id);
      ktpDetails.value.forEach((item, index) => {
        item.position = index + 1;
      });
    }

    const getDetailsByParentId = computed(() => {
      return (parentId: string) =>
        ktpDetails.value.filter((d) => d.parentId === parentId);
    });

    return {
      ktpDetails,
      loading,
      error,
      fetchDetailsForParent,
      addKtpDetail,
      updateKtpDetail,
      deleteKtpDetail,
      getDetailsByParentId,
    };
  },
  {
    persist: true,
  }
);
