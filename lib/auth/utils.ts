import { authServer } from '@/lib/auth/server';

/**
 * Ensures the current request has a valid authenticated session.
 * Used exclusively in server environments (Route Handlers, Server Actions).
 * 
 * @returns {Promise<{ user: any, session: any }>}
 * @throws {Error} Throws an error (which resolves to a 401 response in API catch blocks) if unauthenticated.
 */
export async function getRequiredSession() {
    // Note: authServer.getSession() automatically parses the cookie headers in Next.js Server environments.
    const { data: sessionData, error } = await authServer.getSession();

    if (error || !sessionData?.user) {
        throw new Error('Unauthorized: No active session found');
    }

    return {
        user: sessionData.user,
        session: sessionData.session
    };
}

/**
 * Returns the authenticated user ID safely, or throws if unauthenticated.
 */
export async function getUserId() {
    const { user } = await getRequiredSession();
    return user.id;
}
