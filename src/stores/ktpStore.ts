import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface KtpDetail {
  id: string;
  parentId: string; // Links to the Class9Data ID
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

export const useKtpStore = defineStore(
  "ktp",
  () => {
    const ktpDetails = ref<KtpDetail[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    function fetchDetailsForParent(parentId: string) {
      loading.value = true;
      // Simulate API call
      setTimeout(() => {
        // In a real app, you'd filter from a larger dataset or fetch from an API
        // For now, we return the same mock data regardless of parentId
        ktpDetails.value = mockData
          .filter((d) => d.parentId === "mock-class9-id-1") // Simulating fetch for a specific parent
          .sort((a, b) => a.position - b.position);
        loading.value = false;
      }, 300);
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
      getDetailsByParentId,
    };
  },
  {
    persist: true,
  }
);
