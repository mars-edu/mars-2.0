import { ref } from "vue";

export interface EventData {
  title: string;
  result: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  participants: string[];
}

export interface EventService {
  addEvent(event: EventData): Promise<void>;
  getModuleOptions(): Promise<string[]>;
  getLearningOutcomeOptions(): Promise<string[]>;
}

// Default implementation of EventService
export class DefaultEventService implements EventService {
  private moduleOptions = [
    "Модуль 1: Введение",
    "Модуль 2: Основы",
    "Модуль 3: Продвинутый уровень",
    "Модуль 4: Практика",
  ];

  private learningOutcomeOptions = [
    "Понимание базовых концепций",
    "Применение на практике",
    "Анализ и оценка",
    "Создание новых решений",
  ];

  async addEvent(event: EventData): Promise<void> {
    // In a real application, this would make an API call
    console.log("Adding event:", event);
    return Promise.resolve();
  }

  async getModuleOptions(): Promise<string[]> {
    // In a real application, this would fetch from an API
    return Promise.resolve([...this.moduleOptions]);
  }

  async getLearningOutcomeOptions(): Promise<string[]> {
    // In a real application, this would fetch from an API
    return Promise.resolve([...this.learningOutcomeOptions]);
  }
}

// Create a composable to provide the event service
export function useEventService() {
  // This could be injected from a provider in a real application
  const eventService = ref<EventService>(new DefaultEventService());

  return {
    eventService,
  };
}
