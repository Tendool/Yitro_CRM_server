const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://crm.yitroglobal.com",
  "https://crm.yitroglobal.com",
  "https://dealhub.yitrobc.net",
  "https://www.dealhub.yitrobc.net"
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Allow Builder.io preview domains (fly.dev)
    if (origin.includes('.fly.dev')) {
      return callback(null, true);
    }

    // Allow localhost variants for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
