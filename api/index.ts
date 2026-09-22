import type { IncomingMessage, ServerResponse } from 'http';

let appHandler: any = null;

async function getHandler() {
  if (!appHandler) {
    try {
      // 1. Production bundle (built by npm run build)
      const bundled = await import('../server-dist/server.cjs');
      appHandler = bundled.app || (bundled.default && bundled.default.app) || bundled.default;
    } catch (e1) {
      try {
        // 2. Fallback to TypeScript source
        const tsServer: any = await import('../server.ts');
        appHandler = tsServer.app || (tsServer.default && tsServer.default.app) || tsServer.default;
      } catch (e2) {
        console.error('[Vercel Serverless API] Failed to load Express app:', e1, e2);
        throw e2 || e1;
      }
    }
  }
  return appHandler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // Ensure socket and connection mocks exist to prevent Express getter crashes
    if (!req.socket) {
      (req as any).socket = { remoteAddress: '127.0.0.1' };
    }
    if (!(req as any).connection) {
      (req as any).connection = (req as any).socket;
    }

    const app = await getHandler();
    if (typeof app === 'function') {
      return app(req, res);
    } else if (app && typeof app.handle === 'function') {
      return app.handle(req, res);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Express app instance not available' }));
    }
  } catch (err: any) {
    console.error('[Vercel Invocation Error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'FUNCTION_INVOCATION_FAILED',
      message: err?.message || 'Server error occurred during execution'
    }));
  }
}
