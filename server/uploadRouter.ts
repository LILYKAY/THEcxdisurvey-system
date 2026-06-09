import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { createContext } from "./_core/context";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (PNG, JPG, SVG, WebP, GIF)"));
    }
  },
});

export function registerUploadRouter(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/upload/logo",
    upload.single("logo"),
    async (req, res) => {
      try {
        // Auth check via session cookie
        const ctx = await createContext({ req, res } as any);
        if (!ctx.user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }

        const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "png";
        const key = `logos/org-logo-${ctx.user.id}.${ext}`;
        const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);

        res.json({ url });
      } catch (err: any) {
        console.error("[Upload] Logo upload failed:", err);
        res.status(500).json({ error: err.message ?? "Upload failed" });
      }
    }
  );

  app.use(router);
}
