import { Router, type IRouter } from "express";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  ListArticlesQueryParams,
  SubmitArticleBody,
  GetArticleParams,
  DeleteArticleParams,
  OverrideVerdictParams,
  OverrideVerdictBody,
} from "@workspace/api-zod";
import { detectFakeNews } from "../lib/detect";

const router: IRouter = Router();

router.get("/articles", async (req, res): Promise<void> => {
  const query = ListArticlesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { verdict, limit = 50, offset = 0 } = query.data;

  let rows;
  if (verdict) {
    rows = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.verdict, verdict))
      .orderBy(desc(articlesTable.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.createdAt))
      .limit(limit)
      .offset(offset);
  }

  res.json(rows.map(toArticleResponse));
});

router.post("/articles", async (req, res): Promise<void> => {
  const parsed = SubmitArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, content, url, source } = parsed.data;

  const [pending] = await db
    .insert(articlesTable)
    .values({
      title,
      content,
      url: url ?? null,
      source: source ?? null,
      verdict: "uncertain",
      confidence: 0,
      explanation: "Analyzing...",
      indicators: null,
      status: "pending",
      adminOverride: false,
    })
    .returning();

  const detection = await detectFakeNews(title, content, source);

  const [analyzed] = await db
    .update(articlesTable)
    .set({
      verdict: detection.verdict,
      confidence: detection.confidence,
      explanation: detection.explanation,
      indicators: detection.indicators || null,
      status: "analyzed",
    })
    .where(eq(articlesTable.id, pending.id))
    .returning();

  res.status(201).json(toArticleResponse(analyzed));
});

router.get("/articles/:id", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, params.data.id));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(toArticleResponse(article));
});

router.delete("/articles/:id", async (req, res): Promise<void> => {
  const params = DeleteArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(articlesTable)
    .where(eq(articlesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/articles/:id/verdict", async (req, res): Promise<void> => {
  const params = OverrideVerdictParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = OverrideVerdictBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {
    verdict: body.data.verdict,
    adminOverride: true,
  };
  if (body.data.explanation) {
    updateData.explanation = body.data.explanation;
  }

  const [updated] = await db
    .update(articlesTable)
    .set(updateData)
    .where(eq(articlesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(toArticleResponse(updated));
});

function toArticleResponse(row: typeof articlesTable.$inferSelect) {
  return {
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
  };
}

export default router;
