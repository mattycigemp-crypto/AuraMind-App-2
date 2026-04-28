import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import handler from './index.ts';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy all API requests to the Vercel handler
app.all('/api/:path(*)', async (req, res) => {
  try {
    console.log('API Request:', {
      method: req.method,
      path: req.params.path,
      body: req.body,
      headers: req.headers
    });

    // Simulate Vercel request/response
    const vercelReq = {
      ...req,
      query: {
        path: req.params.path
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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});
