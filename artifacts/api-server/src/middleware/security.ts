import helmet from 'helmet';
import { RequestHandler } from 'express';

export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://176.12.72.246.nip.io',
          'wss://176.12.72.246',
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false,
  }),
];

export const webViewCspMiddleware: RequestHandler = (
  _req,
  res,
  next
) => {
  res.setHeader(
    'X-Bunker-Security',
    'webview-protected'
  );
  next();
};
