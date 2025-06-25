import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface BuildInfo {
  buildTime: string
  environment: string
  version: string
  appName: string
  timestamp: number
  viteVersion: string
  nodeVersion: string
}

export interface CompileBuildInfo {
  buildTime: string
  environment: string
  version: string
}

export interface UseBuildInfoReturn {
  buildInfo: Ref<Partial<BuildInfo>>
  compileBuildInfo: CompileBuildInfo
  formattedBuildTime: ComputedRef<string>
  isDevelopment: ComputedRef<boolean>
  isProduction: ComputedRef<boolean>
  buildAgeMinutes: ComputedRef<number>
  buildAgeHours: ComputedRef<number>
}

declare global {
  interface Window {
    __BUILD_INFO__?: Partial<BuildInfo>
  }
}

declare const __BUILD_TIME__: string
declare const __BUILD_ENV__: string
declare const __APP_VERSION__: string

export function useBuildInfo(): UseBuildInfoReturn {
  const runtimeBuildInfo = ref<Partial<BuildInfo>>(window.__BUILD_INFO__ || {})
  
  const compileBuildInfo: CompileBuildInfo = {
    buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Unknown',
    environment: typeof __BUILD_ENV__ !== 'undefined' ? __BUILD_ENV__ : 'development',
    version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'
  }
  
  const formattedBuildTime = computed<string>(() => {
    const buildTime = runtimeBuildInfo.value.buildTime || compileBuildInfo.buildTime
    if (buildTime && buildTime !== 'Unknown') {
      try {
        return new Date(buildTime).toLocaleString()
      } catch (error) {
        return 'Invalid Date'
      }
    }
    return 'Unknown'
  })
  
  const isDevelopment = computed<boolean>(() => {
    const env = runtimeBuildInfo.value.environment || compileBuildInfo.environment
    return env === 'development'
  })
  
  const isProduction = computed<boolean>(() => {
    const env = runtimeBuildInfo.value.environment || compileBuildInfo.environment
    return env === 'production'
  })
  
  const buildAgeMinutes = computed<number>(() => {
    if (runtimeBuildInfo.value.timestamp) {
      return Math.floor((Date.now() - runtimeBuildInfo.value.timestamp) / (1000 * 60))
    }
    return 0
  })
  
  const buildAgeHours = computed<number>(() => {
    return Math.floor(buildAgeMinutes.value / 60)
  })
  
  return {
    buildInfo: runtimeBuildInfo,
    compileBuildInfo,
    formattedBuildTime,
    isDevelopment,
    isProduction,
    buildAgeMinutes,
    buildAgeHours,
  }
}