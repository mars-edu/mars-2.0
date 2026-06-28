import { internalQuery } from "../_generated/server";
export const checkTeacherDual = internalQuery({ args: {}, handler: async (ctx) => {
  const t = new Set((await ctx.db.query("teachers").collect()).map(x=>x._id as string));
  const u = new Set((await ctx.db.query("users").collect()).map(x=>x._id as string));
  const cls = (v:any)=> v==null||v===""?null: t.has(v)?"teacher": u.has(v)?"USER(wrong)":"orphan";
  const tally=(vals:any[])=>{const c={teacher:0,"USER(wrong)":0,orphan:0} as any;for(const v of vals){const k=cls(v);if(k)c[k]++;}return c;};
  const evs=await ctx.db.query("calendarEvents").collect();
  const wls=await ctx.db.query("workloads").collect();
  const mrs=await ctx.db.query("makeupRequests").collect();
  return {
    "calendarEvents.teacherId": tally(evs.map(e=>(e as any).teacherId)),
    "workloads.teacherId": tally(wls.map(w=>(w as any).teacherId)),
    "makeupRequests.teacherId": tally(mrs.map(m=>(m as any).teacherId)),
  };
}});
