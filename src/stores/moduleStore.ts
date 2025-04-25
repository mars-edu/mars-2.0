import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Module {
  id: string;
  specialtyId: string;
  courseId: string;
  [key: string]: string;
}

export const useModuleStore = defineStore(
  "module",
  () => {
    const modules = ref<Module[]>([]);

    const getModulesBySpecialtyAndCourse = computed(() => {
      return (specialtyId: string, courseId: string) => {
        return modules.value.filter(
          (module) =>
            module.specialtyId === specialtyId && module.courseId === courseId
        );
      };
    });

    function addModule(module: Module) {
      if (!module.id) {
        module.id = crypto.randomUUID();
      }
      modules.value.push(module);
    }

    function removeModule(id: string) {
      const index = modules.value.findIndex((module) => module.id === id);
      if (index !== -1) {
        modules.value.splice(index, 1);
      }
    }

    function updateModuleField(
      moduleId: string,
      fieldName: string,
      value: string
    ) {
      const moduleIndex = modules.value.findIndex(
        (module) => module.id === moduleId
      );
      if (moduleIndex !== -1) {
        modules.value[moduleIndex][fieldName] = value;
      }
    }

    function clearModules() {
      modules.value = [];
    }

    function clearModulesBySpecialtyAndCourse(
      specialtyId: string,
      courseId: string
    ) {
      modules.value = modules.value.filter(
        (module) =>
          !(module.specialtyId === specialtyId && module.courseId === courseId)
      );
    }

    return {
      modules,
      getModulesBySpecialtyAndCourse,
      addModule,
      removeModule,
      updateModuleField,
      clearModules,
      clearModulesBySpecialtyAndCourse,
    };
  },
  {
    persist: true,
  }
);
