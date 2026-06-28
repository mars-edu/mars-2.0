import { internalQuery } from "../_generated/server";
export const checkTeacherCoverage = internalQuery({ args: {}, handler: async (ctx) => {
  const teachers = await ctx.db.query("teachers").collect();
  const withTeacher = new Set(teachers.map(t => (t as any).userId).filter(Boolean));
  const users = await ctx.db.query("users").collect();
  const teacherUsers = users.filter(u => ((u as any).roles ?? []).includes("TEACHER"));
  const missing = teacherUsers.filter(u => !withTeacher.has(u._id as string))
    .map(u => ({ id: u._id, name: `${(u as any).firstName} ${(u as any).lastName}` }));
  return { teacherRoleUsers: teacherUsers.length, teacherRecords: teachers.length, missingTeacherRecord: missing };
}});
