import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const getTests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tests").order("desc").collect();
  },
});

export const getTestHistory = query({
  args: {},
  handler: async (ctx) => {
    const assignments = await ctx.db.query("testAssignments").order("desc").collect();
    
    const history = await Promise.all(
      assignments.map(async (assignment) => {
        const test = await ctx.db.get(assignment.testId);
        const journal = await ctx.db.get(assignment.journalId);
        
        let groupName = journal?.groupName || "Неизвестная группа";
        let disciplineName = "Неизвестный предмет";
        
        if (journal && journal.disciplineId) {
          const class9 = await ctx.db.get(journal.disciplineId as Id<"class9Items">);
          if (class9) {
             disciplineName = `${class9.moduleIndex} ${class9.learningOutcome}`.trim();
          }
        }
        
        // Fetch test results for this assignment
        const results = await ctx.db
          .query("testResults")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
          .collect();
          
        // Since we are mocking the test-taking engine for now, if there are no results 
        // we can still show the number of students assigned to the journal.
        let studentsCount = results.length;
        if (studentsCount === 0 && journal) {
            const journalStudents = await ctx.db
                .query("journalStudents")
                .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
                .collect();
            studentsCount = journalStudents.length;
        }

        let averageResult = 0;
        
        if (results.length > 0) {
          const totalScore = results.reduce((sum, r) => sum + r.score, 0);
          averageResult = Math.round(totalScore / results.length);
        }
        
        return {
          id: assignment._id,
          testTitle: test?.title || "Неизвестный тест",
          subject: test?.subject || disciplineName,
          group: groupName,
          studentsCount,
          date: assignment.date,
          averageResult,
        };
      })
    );
    
    return history;
  },
});
