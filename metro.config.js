const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Expo Web: przeglądarka nie może wołać ngrok/FastAPI przez CORS.
 * Proxujemy `/zus-proxy/*` → EXPO_PUBLIC_API_URL (same-origin).
 */
const config = getDefaultConfig(__dirname);

const PROXY_PREFIX = '/zus-proxy';

function readTargetBase() {
  const raw =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000';
  return raw.replace(/\/$/, '');
}

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (!req.url?.startsWith(PROXY_PREFIX)) {
        return middleware(req, res, next);
      }

      try {
        // Same-origin JSON POST i tak wysyła preflight — FastAPI bez Origin zwraca 405.
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Methods':
              'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              req.headers['access-control-request-headers'] ||
              'content-type, authorization, accept, ngrok-skip-browser-warning',
            'Access-Control-Max-Age': '600',
          });
          res.end();
          return;
        }

        const targetBase = readTargetBase();
        const pathAndQuery = req.url.slice(PROXY_PREFIX.length) || '/';
        const target = new URL(pathAndQuery, `${targetBase}/`);
        const lib = target.protocol === 'https:' ? https : http;

        const headers = { ...req.headers, host: target.host };
        delete headers['origin'];
        delete headers['referer'];
        if (/ngrok/i.test(target.hostname)) {
          headers['ngrok-skip-browser-warning'] = 'true';
        }

        const proxyReq = lib.request(
          target,
          {
            method: req.method,
            headers,
            /** OpenRouter / explain może trwać ~15s — nie ucinaj wcześniej. */
            timeout: 30_000,
          },
          (proxyRes) => {
            const outHeaders = { ...proxyRes.headers };
            // Same-origin odpowiedź — bez CORS do przeglądarki.
            delete outHeaders['access-control-allow-origin'];
            delete outHeaders['access-control-allow-credentials'];
            res.writeHead(proxyRes.statusCode || 502, outHeaders);
            proxyRes.pipe(res);
          },
        );

        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                detail: 'Proxy: przekroczono czas oczekiwania na FastAPI.',
              }),
            );
          }
        });

        proxyReq.on('error', (error) => {
          if (res.headersSent) return;
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              detail: `Proxy FastAPI niedostępne: ${error.message}`,
            }),
          );
        });

        req.pipe(proxyReq);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            detail: error instanceof Error ? error.message : 'Proxy error',
          }),
        );
      }
    };
  },
};

module.exports = config;
