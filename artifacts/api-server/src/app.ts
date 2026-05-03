import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

const MOBILE_STATIC_ROOT = path.resolve(
  __dirname,
  "../../artifacts/bloom/static-build",
);

const MOBILE_TEMPLATE_PATH = path.resolve(
  __dirname,
  "../../artifacts/bloom/server/templates/landing-page.html",
);

const MOBILE_APP_JSON_PATH = path.resolve(
  __dirname,
  "../../artifacts/bloom/app.json",
);

function getMobileAppName(): string {
  try {
    const appJson = JSON.parse(fs.readFileSync(MOBILE_APP_JSON_PATH, "utf-8"));
    return (appJson as { expo?: { name?: string } }).expo?.name ?? "App";
  } catch {
    return "App";
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

app.use("/mobile", (req: Request, res: Response) => {
  if (!fs.existsSync(MOBILE_STATIC_ROOT)) {
    res.status(503).send("Mobile app not built yet");
    return;
  }

  let pathname = req.path || "/";

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"] as string | undefined;

    if (platform === "ios" || platform === "android") {
      const manifestPath = path.join(
        MOBILE_STATIC_ROOT,
        platform,
        "manifest.json",
      );
      if (!fs.existsSync(manifestPath)) {
        res
          .status(404)
          .json({ error: `Manifest not found for platform: ${platform}` });
        return;
      }
      const manifest = fs.readFileSync(manifestPath, "utf-8");
      res.set({
        "content-type": "application/json",
        "expo-protocol-version": "1",
        "expo-sfv-version": "0",
      });
      res.send(manifest);
      return;
    }

    if (pathname === "/") {
      try {
        const template = fs.readFileSync(MOBILE_TEMPLATE_PATH, "utf-8");
        const forwardedProto = req.headers["x-forwarded-proto"] as
          | string
          | undefined;
        const protocol = forwardedProto ?? "https";
        const host =
          (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host ?? "";
        const baseUrl = `${protocol}://${host}`;
        const expsUrl = host;
        const appName = getMobileAppName();
        const html = template
          .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
          .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
          .replace(/APP_NAME_PLACEHOLDER/g, appName);
        res.set("content-type", "text/html; charset=utf-8");
        res.send(html);
      } catch {
        res.status(500).send("Failed to load mobile landing page");
      }
      return;
    }
  }

  const safePath = path
    .normalize(pathname)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(MOBILE_STATIC_ROOT, safePath);

  if (!filePath.startsWith(MOBILE_STATIC_ROOT)) {
    res.status(403).send("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.status(404).send("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  res.set("content-type", contentType);
  res.send(fs.readFileSync(filePath));
});

export default app;
