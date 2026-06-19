import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "fakenews_salt_2024").digest("hex");
}

declare module "express-session" {
  interface SessionData {
    adminUsername?: string;
    adminRole?: string;
  }
}

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const hash = hashPassword(password);

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username));

  if (!admin || admin.passwordHash !== hash) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.adminUsername = admin.username;
  req.session.adminRole = admin.role;

  res.json({ username: admin.username, role: admin.role });
});

router.post("/admin/logout", async (req: Request, res: Response): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/admin/me", async (req: Request, res: Response): Promise<void> => {
  if (!req.session.adminUsername) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    username: req.session.adminUsername,
    role: req.session.adminRole ?? "admin",
  });
});

export default router;
