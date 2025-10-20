import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

console.log("[lib/utils] Utility functions module loaded");

export function cn(...inputs: ClassValue[]) {
  console.log("[lib/utils] cn function called with inputs:", inputs);
  const result = twMerge(clsx(inputs));
  console.log("[lib/utils] cn function result:", result);
  return result;
}

export function withAllOption<T extends { value: any; text: string }>(
  options: T[],
  allText = "Все",
  allValue: any = ""
): (T | { value: any; text: string })[] {
  console.log("[lib/utils] withAllOption called:", {
    optionsCount: options.length,
    allText,
    allValue,
  });

  const result = [{ value: allValue, text: allText }, ...options];
  console.log("[lib/utils] withAllOption result:", {
    resultLength: result.length,
    firstItem: result[0],
    lastItem: result[result.length - 1],
  });

  return result;
}

export function getGenderOptions(allText = "Все", allValue: any = "") {
  console.log("[lib/utils] getGenderOptions called:", { allText, allValue });

  const genderOptions = [
    { value: "male", text: "Мужской" },
    { value: "female", text: "Женский" },
  ];

  console.log("[lib/utils] Base gender options:", genderOptions);

  const result = withAllOption(genderOptions, allText, allValue);
  console.log("[lib/utils] getGenderOptions result:", result);

  return result;
}
