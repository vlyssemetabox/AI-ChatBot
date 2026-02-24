import { createNeonAuth } from '@neondatabase/auth';

if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error('NEON_AUTH_BASE_URL environment variable is required');
}

export const auth = createNeonAuth({
    baseURL: process.env.NEON_AUTH_BASE_URL,
    cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET,
});
