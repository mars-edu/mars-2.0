const { execSync } = require('child_process');

const affectedTables = [
  "academicYears", "semesterDefinitions", "academicYearSemesters", "specialties", 
  "courses", "bases", "positions", "cabinets", "disciplines", "modules",
  "users", "permissions", "permissionHistory", "sessions", "passwordChangeHistory",
  "calendarEvents", "ktps", "ktpDetails", "journals", "journalStudents", "marks", 
  "markHistory", "journalClosureReminders", "files", "offlineQueue", "notifications", 
  "announcements", "announcementCategories", "students", "teachers", "teacherChangeHistory",
  "rupEntries", "distributionEntries", "intermediateControls", "finalControls", 
  "scheduledIntermediateControls", "scheduledFinalControls", "educationSchedules", 
  "vacations", "substitutions", "makeupRequests", "tests", "testAssignments", "testResults", "workloads"
];

const isProd = process.argv.includes('--prod');
const prodFlag = isProd ? '--prod ' : '';

for (const table of affectedTables) {
  console.log(`Migrating ${table}...`);
  try {
    const cmd = `npx convex run ${prodFlag}migrations/index:run '{"fn":"migrations/timestamps:m_${table}"}'`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(output);
  } catch (error) {
    console.error(`Failed to migrate ${table}`);
    console.error(error.stdout || error.message);
  }
}
