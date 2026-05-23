import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.resolve(__dirname, '../.env') });

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`Fatal: Missing required env var ${key}`);
    process.exit(1);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || './data/alsultan.db',
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: requireEnv('ADMIN_PASSWORD'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};
