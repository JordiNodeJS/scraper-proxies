export const productionConfig = {
  environment: "production",
  server: {
    port: 3001,
    host: "0.0.0.0",
  },
  cors: {
    origin: [
      "http://localhost:5173",
      "http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080",
      "http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com",
      "http://localhost:4173",
    ],
    credentials: true,
  },
  sse: {
    heartbeatInterval: 30000,
    clientTimeout: 60000,
    autoCleanup: true,
    maxConnections: 50,
  },
  api: {
    timeout: 30000,
    retries: 3,
  },
  logging: {
    level: "info",
    maxLogs: 100,
    enableConsole: true,
    enableFile: false,
  },
  production: {
    enableHotReload: false,
    enableDetailedLogs: false,
    enableMetrics: true,
  },
  urls: {
    frontend: "http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3080",
    backend: "http://ec2-3-254-74-19.eu-west-1.compute.amazonaws.com:3081",
  },
};

export type ProductionConfig = typeof productionConfig; 