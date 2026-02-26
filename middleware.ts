import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default neonAuthMiddleware({
    loginUrl: '/auth/login',
});

export const config = {
    matcher: [
        /*
         * Only protect:
         * - /dashboard (and sub-routes)
         * - /api/* (except /api/auth/* which is handled by Neon Auth)
         * Public by exclusion: /, /auth/*, static files
         */
        '/dashboard/:path*',
        '/api/((?!auth).*)',
    ],
};
