import express from "express";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Lê o valor de uma chave (retorna { key, value } ou 404)
app.get("/api/storage/:key", async (req, res) => {
  try {
    const entry = await prisma.entry.findUnique({ where: { key: req.params.key } });
    if (!entry) return res.status(404).json({ error: "not found" });
    res.json({ key: entry.key, value: entry.value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal error" });
  }
});

// Grava (cria ou atualiza) o valor de uma chave
app.put("/api/storage/:key", async (req, res) => {
  const { value } = req.body ?? {};
  if (typeof value !== "string") {
    return res.status(400).json({ error: "body must be { value: string }" });
  }
  try {
    const entry = await prisma.entry.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value },
      update: { value },
    });
    res.json({ key: entry.key, value: entry.value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal error" });
  }
});

// Serve o frontend compilado (dist/) — assim um único servidor entrega site + API
const distDir = path.join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Verum Canvas rodando em http://localhost:${PORT}`);
});
