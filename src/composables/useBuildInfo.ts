import { ref, computed, type Ref, type ComputedRef } from "vue";

console.log("[useBuildInfo] Composable module loaded");

export interface BuildInfo {
  buildTime: string;
  environment: string;
  version: string;
  appName: string;
  timestamp: number;
  viteVersion: string;
  nodeVersion: string;
}

export interface CompileBuildInfo {
  buildTime: string;
  environment: string;
  version: string;
}

export interface UseBuildInfoReturn {
  buildInfo: Ref<Partial<BuildInfo>>;
  compileBuildInfo: CompileBuildInfo;
  formattedBuildTime: ComputedRef<string>;
  isDevelopment: ComputedRef<boolean>;
  isProduction: ComputedRef<boolean>;
  buildAgeMinutes: ComputedRef<number>;
  buildAgeHours: ComputedRef<number>;
}

declare global {
  interface Window {
    __BUILD_INFO__?: Partial<BuildInfo>;
  }
}

declare const __BUILD_TIME__: string;
declare const __BUILD_ENV__: string;
declare const __APP_VERSION__: string;

export function useBuildInfo(): UseBuildInfoReturn {
  console.log("[useBuildInfo] Composable function called");

  const runtimeBuildInfo = ref<Partial<BuildInfo>>(window.__BUILD_INFO__ || {});
  console.log(
    "[useBuildInfo] Runtime build info loaded:",
    runtimeBuildInfo.value
  );

  const compileBuildInfo: CompileBuildInfo = {
    buildTime:
      typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "Unknown",
    environment:
      typeof __BUILD_ENV__ !== "undefined" ? __BUILD_ENV__ : "development",
    version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0",
  };

  console.log("[useBuildInfo] Compile build info:", compileBuildInfo);

  const formattedBuildTime = computed<string>(() => {
    const buildTime =
      runtimeBuildInfo.value.buildTime || compileBuildInfo.buildTime;
    console.log(
      "[useBuildInfo] Computing formatted build time from:",
      buildTime
    );

    if (buildTime && buildTime !== "Unknown") {
      try {
        const formatted = new Date(buildTime).toLocaleString();
        console.log("[useBuildInfo] Formatted build time computed:", formatted);
        return formatted;
      } catch (error) {
        console.error("[useBuildInfo] Error formatting build time:", error);
        return "Invalid Date";
      }
    }
    console.log("[useBuildInfo] No valid build time available");
    return "Unknown";
  });

  const isDevelopment = computed<boolean>(() => {
    const env =
      runtimeBuildInfo.value.environment || compileBuildInfo.environment;
    console.log(
      "[useBuildInfo] Computing isDevelopment from environment:",
      env
    );
    const result = env === "development";
    console.log("[useBuildInfo] isDevelopment computed:", result);
    return result;
  });

  const isProduction = computed<boolean>(() => {
    const env =
      runtimeBuildInfo.value.environment || compileBuildInfo.environment;
    console.log("[useBuildInfo] Computing isProduction from environment:", env);
    const result = env === "production";
    console.log("[useBuildInfo] isProduction computed:", result);
    return result;
  });

  const buildAgeMinutes = computed<number>(() => {
    const timestamp = runtimeBuildInfo.value.timestamp;
    console.log(
      "[useBuildInfo] Computing build age minutes from timestamp:",
      timestamp
    );

    if (timestamp) {
      const age = Math.floor((Date.now() - timestamp) / (1000 * 60));
      console.log("[useBuildInfo] Build age minutes computed:", age);
      return age;
    }
    console.log(
      "[useBuildInfo] No timestamp available for build age calculation"
    );
    return 0;
  });

  const buildAgeHours = computed<number>(() => {
    const hours = Math.floor(buildAgeMinutes.value / 60);
    console.log(
      "[useBuildInfo] Build age hours computed from minutes:",
      buildAgeMinutes.value,
      "->",
      hours
    );
    return hours;
  });

  return {
    buildInfo: runtimeBuildInfo,
    compileBuildInfo,
    formattedBuildTime,
    isDevelopment,
    isProduction,
    buildAgeMinutes,
    buildAgeHours,
  };
}
