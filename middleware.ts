import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default neonAuthMiddleware({
    loginUrl: '/auth/login',
});

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - / (landing page)
         * - /auth/* (login/signup)
         * - /api/auth/* (auth API handlers)
         * - /_next/* (Next.js internals)
         * - Static files (favicon, images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/auth|auth).*)',
    ],
};
