import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withAllOption<T extends { value: any; text: string }>(
  options: T[],
  allText = "Все",
  allValue: any = ""
): (T | { value: any; text: string })[] {
  return [{ value: allValue, text: allText }, ...options];
}

export function getGenderOptions(allText = "Все", allValue: any = "") {
  return withAllOption(
    [
      { value: "male", text: "Мужской" },
      { value: "female", text: "Женский" },
    ],
    allText,
    allValue
  );
}
