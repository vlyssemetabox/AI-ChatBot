import { createAuthClient } from '@neondatabase/auth/next';

const authClient = createAuthClient();
console.log('forgetPassword:', Object.keys(authClient.forgetPassword || {}));
console.log('resetPassword:', typeof authClient.resetPassword === 'function' ? 'function' : Object.keys(authClient.resetPassword || {}));
