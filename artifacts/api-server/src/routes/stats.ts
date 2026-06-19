import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import { GetRecentDetectionsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/summary", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      verdict: articlesTable.verdict,
      count: sql<number>`cast(count(*) as int)`,
      avgConfidence: sql<number>`avg(${articlesTable.confidence})`,
    })
    .from(articlesTable)
    .groupBy(articlesTable.verdict);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(articlesTable)
    .where(sql`${articlesTable.createdAt} >= ${today}`);

  const total = rows.reduce((s, r) => s + r.count, 0);
  const fakeRow = rows.find((r) => r.verdict === "fake");
  const realRow = rows.find((r) => r.verdict === "real");
  const uncertainRow = rows.find((r) => r.verdict === "uncertain");

  const fake = fakeRow?.count ?? 0;
  const real = realRow?.count ?? 0;
  const uncertain = uncertainRow?.count ?? 0;
  const avgConf =
    total > 0
      ? rows.reduce((s, r) => s + (r.avgConfidence ?? 0) * r.count, 0) / total
      : 0;

  res.json({
    total,
    fake,
    real,
    uncertain,
    fakePercent: total > 0 ? Math.round((fake / total) * 100) : 0,
    realPercent: total > 0 ? Math.round((real / total) * 100) : 0,
    todayCount: todayRow?.count ?? 0,
    avgConfidence: Math.round(avgConf),
  });
});

router.get("/stats/recent", async (req, res): Promise<void> => {
  const query = GetRecentDetectionsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 10) : 10;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.status, "analyzed"))
    .orderBy(desc(articlesTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      url: row.url,
      source: row.source,
      verdict: row.verdict,
      confidence: row.confidence,
      explanation: row.explanation,
      indicators: row.indicators,
      status: row.status,
      adminOverride: row.adminOverride,
      createdAt: row.createdAt.toISOString(),
    })),
  );
});

router.get("/stats/daily", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT 
      date_trunc('day', created_at AT TIME ZONE 'UTC')::date::text as date,
      cast(count(*) as int) as total,
      cast(sum(case when verdict = 'fake' then 1 else 0 end) as int) as fake,
      cast(sum(case when verdict = 'real' then 1 else 0 end) as int) as real,
      cast(sum(case when verdict = 'uncertain' then 1 else 0 end) as int) as uncertain
    FROM articles
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  res.json(rows.rows);
});

export default router;
