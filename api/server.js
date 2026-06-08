import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import handler from './index.js';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'auramind-gemini', 'dist');
const hasStaticBuild = fs.existsSync(distDir);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://auramind.app'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy all API requests to the Vercel handler (runs first for all /api/* paths)
app.use('/api', async (req, res) => {
  try {
    const fullPath = req.url.startsWith('/') ? req.url.substring(1) : req.url; // Remove leading slash if present

    // Sanitized logging — never log body (may contain tokens/PII) or auth headers
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${req.method} /api/${fullPath}`);
    }

    // Simulate Vercel request/response
    const vercelReq = {
      ...req,
      query: {
        path: fullPath
      },
      headers: req.headers,
      body: req.body,
      method: req.method
    };

    const vercelRes = {
      status: (code) => {
        res.status(code);
        return vercelRes;
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
        return vercelRes;
      },
      send: (body) => {
        res.send(body);
        return vercelRes;
      },
      json: (body) => {
        res.json(body);
        return vercelRes;
      }
    };

    await handler(vercelReq, vercelRes);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auramind-api', version: '2.0.0', timestamp: Date.now() });
});

// In production, serve the built frontend from dist/
if (hasStaticBuild) {
  app.use(express.static(distDir));
  // SPA fallback — catch-all for client-side routes like /admin/vault
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'auramind-api', version: '2.0.0' });
  });
}

app.listen(PORT, () => {
  const mode = hasStaticBuild ? 'production' : 'development';
  console.log(`AuraMind API server (${mode}) running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
  if (hasStaticBuild) {
    console.log(`Frontend being served from ${distDir}`);
  }
});
