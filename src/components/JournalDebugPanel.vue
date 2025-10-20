<template>
  <details class="bg-gray-50 dark:bg-gray-900/20 rounded border border-gray-300 dark:border-gray-700">
    <summary class="cursor-pointer px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
      Debug Info
    </summary>
    <div class="p-3 space-y-3 text-xs font-mono">
      <!-- Copy Button -->
      <div class="flex justify-end">
        <button
          @click="copyDebugInfo"
          class="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded font-sans transition-colors flex items-center gap-1"
        >
          <span v-if="!copied">📋 Copy JSON</span>
          <span v-else>✅ Copied</span>
        </button>
      </div>
      
      <!-- Journal Info -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Journal Information</h4>
        <div class="space-y-1 text-xs">
          <div><strong>Journal ID:</strong> {{ journalId }}</div>
          <div><strong>Discipline ID:</strong> {{ disciplineId }}</div>
          <div><strong>Group:</strong> {{ group }}</div>
          <div><strong>Academic Year ID:</strong> {{ debugInfo.academicYearId }}</div>
          <div><strong>Academic Year:</strong> {{ academicYear }}</div>
          <div><strong>Semester ID:</strong> {{ debugInfo.semesterId }}</div>
          <div><strong>Semester:</strong> {{ semester }}</div>
        </div>
      </div>

      <!-- Distribution Info -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Distribution (РУП) Information</h4>
        <div class="space-y-1 text-xs">
          <div><strong>Total Distribution Entries (all semesters/years):</strong> {{ debugInfo.totalDistributionEntries || 0 }}</div>
          <div><strong>Filtered Distribution Entries (current semester/year):</strong> 
            <span :class="debugInfo.distributionEntriesCount === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'">
              {{ debugInfo.distributionEntriesCount }}
            </span>
          </div>
          <div v-if="debugInfo.distributionEntriesCount === 0 && debugInfo.totalDistributionEntries > 0" 
               class="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded border border-yellow-300 text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Warning:</strong> РУП has {{ debugInfo.totalDistributionEntries }} entries, but NONE match current semester/year!
            <div class="mt-1 text-xs">
              <strong>Possible reasons:</strong>
              <ul class="list-disc ml-4 mt-1">
                <li>Semester IDs in РУП don't match current semester UUID</li>
                <li>Academic year IDs don't match</li>
                <li>РУП entries are for different semesters/years</li>
              </ul>
              <div class="mt-1 font-bold">
                ✅ Expected: semesterId must be a UUID matching current semester
              </div>
            </div>
          </div>
          <div v-if="debugInfo.totalDistributionEntries === 0" 
               class="bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-300 text-red-800 dark:text-red-200">
            ❌ <strong>Error:</strong> РУП has NO distribution entries at all! Please add РУП data.
          </div>
          <div v-if="debugInfo.allDistributionEntries && debugInfo.allDistributionEntries.length > 0">
            <strong>All Distribution Entries:</strong>
            <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32 text-xs">{{ JSON.stringify(debugInfo.allDistributionEntries, null, 2) }}</pre>
          </div>
          <div><strong>Intermediate Control IDs from Distribution:</strong></div>
          <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32 text-xs">{{ JSON.stringify(debugInfo.distributionIntermediateControlIds, null, 2) }}</pre>
          <div><strong>Final Control IDs from Distribution:</strong></div>
          <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32 text-xs">{{ JSON.stringify(debugInfo.distributionFinalControlIds, null, 2) }}</pre>
        </div>
      </div>

      <!-- Scheduled Controls -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Scheduled Controls (for Academic Year)</h4>
        <div class="space-y-1 text-xs">
          <div><strong>Scheduled Intermediate Controls (Total):</strong> {{ debugInfo.scheduledIntermediateCount }}</div>
          <div><strong>Scheduled Final Controls (Total):</strong> {{ debugInfo.scheduledFinalCount }}</div>
          <div><strong>Filtered Intermediate Controls:</strong> {{ debugInfo.filteredIntermediateCount }}</div>
          <div><strong>Filtered Final Controls:</strong> {{ debugInfo.filteredFinalCount }}</div>
        </div>
      </div>

      <!-- Intermediate Controls Details -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Intermediate Controls Details</h4>
        <div class="space-y-2 text-xs">
          <div v-for="control in debugInfo.intermediateControlsDetails" :key="control.id">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200">
              <div><strong>ID:</strong> {{ control.id }}</div>
              <div><strong>Name:</strong> {{ control.name }}</div>
              <div><strong>Short Name:</strong> {{ control.shortName }}</div>
              <div><strong>In Distribution:</strong> {{ control.inDistribution ? '✅ Yes' : '❌ No' }}</div>
              <div><strong>Scheduled for Year:</strong> {{ control.scheduledForYear ? '✅ Yes' : '❌ No' }}</div>
              <div v-if="control.scheduledForYear">
                <strong>Scheduled Dates:</strong> {{ control.startDate }} → {{ control.endDate }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Controls Details -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Final Controls Details</h4>
        <div class="space-y-2 text-xs">
          <div v-for="control in debugInfo.finalControlsDetails" :key="control.id">
            <div 
              class="p-2 rounded border"
              :class="control.willBeShown 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200' 
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'"
            >
              <div><strong>ID:</strong> {{ control.id }}</div>
              <div><strong>Name:</strong> {{ control.name }}</div>
              <div><strong>Short Name:</strong> {{ control.shortName }}</div>
              <div><strong>In Distribution:</strong> {{ control.inDistribution ? '✅ Yes' : '❌ No' }}</div>
              <div><strong>Scheduled for Year:</strong> {{ control.scheduledForYear ? '✅ Yes' : '❌ No' }}</div>
              <div v-if="control.scheduledForYear">
                <strong>Scheduled Dates:</strong> {{ control.startDate }} → {{ control.endDate }}
              </div>
              <div 
                class="mt-2 p-2 rounded font-bold"
                :class="control.willBeShown 
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'"
              >
                {{ control.filterDecision }}
              </div>
              <div class="mt-1">
                <strong>Will be shown in journal:</strong> 
                <span :class="control.willBeShown ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                  {{ control.willBeShown ? '✅ YES' : '❌ NO' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Control Filtering Log -->
      <div v-if="debugInfo.finalControlFilteringLog && debugInfo.finalControlFilteringLog.length > 0" 
           class="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-300">
        <h4 class="font-bold text-yellow-800 dark:text-yellow-300 mb-1 text-xs">
          🔍 Final Control Filtering Detailed Log
        </h4>
        <div class="space-y-2 text-xs">
          <div v-for="(log, idx) in debugInfo.finalControlFilteringLog" :key="idx">
            <div class="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-200">
              <div><strong>Control ID:</strong> {{ log.controlId }}</div>
              <div><strong>Control Name:</strong> {{ log.controlName }}</div>
              <div><strong>Distribution IDs Count:</strong> {{ log.distributionIdsCount }}</div>
              <div><strong>Distribution IDs:</strong> 
                <code class="bg-gray-100 dark:bg-gray-900 px-1 rounded">{{ JSON.stringify(log.distributionIds) }}</code>
              </div>
              <div><strong>Is in Distribution:</strong> {{ log.isInDistribution ? '✅ Yes' : '❌ No' }}</div>
              <div 
                class="mt-1 p-1 rounded font-bold text-xs"
                :class="log.decision.startsWith('SHOWN') 
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'"
              >
                {{ log.decision }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Column Headers -->
      <div class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200">
        <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-1 text-xs">Generated Table Headers</h4>
        <div class="space-y-1 text-xs">
          <div><strong>Total Columns:</strong> {{ tableHeaders.length }}</div>
          <div><strong>Session Columns:</strong> {{ debugInfo.sessionHeadersCount }}</div>
          <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-64 text-xs">{{ JSON.stringify(debugInfo.headersSummary, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7 } from "framework7-vue";

const props = defineProps<{
  journalId: string;
  disciplineId?: string;
  group?: string;
  academicYear: string;
  semester: string;
  disciplineText: string;
  debugInfo: any;
  tableHeaders: any[];
}>();

const copied = ref(false);

const copyDebugInfo = async () => {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      journal: {
        id: props.journalId,
        disciplineId: props.disciplineId,
        group: props.group,
        discipline: props.disciplineText,
        academicYear: props.academicYear,
        semester: props.semester,
      },
      debugInfo: props.debugInfo,
    };
    
    const jsonString = JSON.stringify(debugData, null, 2);
    await navigator.clipboard.writeText(jsonString);
    
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy debug info:", error);
    f7.dialog.alert("Не удалось скопировать информацию в буфер обмена");
  }
};
</script>
