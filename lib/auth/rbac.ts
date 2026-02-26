import { db } from '@/lib/db/neon';
import { orgMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================
// Role Constants
// ============================================================
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Role[] = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

// ============================================================
// Core Functions
// ============================================================

/**
 * Get the user's org membership (org + role), or null if they haven't joined any.
 */
export async function getUserOrgMembership(userId: string) {
    const membership = await db
        .select({
            orgId: orgMembers.orgId,
            role: orgMembers.role,
        })
        .from(orgMembers)
        .where(eq(orgMembers.userId, userId))
        .limit(1);

    if (membership.length === 0) return null;

    return {
        orgId: membership[0].orgId,
        role: membership[0].role as Role,
    };
}

/**
 * Require the user to belong to an org. Returns the orgId.
 * Throws 403 if the user has no org.
 */
export async function requireOrg(userId: string): Promise<string> {
    const membership = await getUserOrgMembership(userId);
    if (!membership) {
        throw new Error('Forbidden: User does not belong to any organization');
    }
    return membership.orgId;
}

/**
 * Require a minimum role level. Throws 403 if insufficient.
 * Returns { orgId, role }.
 */
export async function requireRole(
    userId: string,
    minimumRole: Role
): Promise<{ orgId: string; role: Role }> {
    const membership = await getUserOrgMembership(userId);
    if (!membership) {
        throw new Error('Forbidden: User does not belong to any organization');
    }

    const userLevel = ROLE_HIERARCHY.indexOf(membership.role);
    const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);

    if (userLevel < requiredLevel) {
        throw new Error(`Forbidden: Requires ${minimumRole} role`);
    }

    return membership;
}

/**
 * Check if a role string is valid.
 */
export function isValidRole(role: string): role is Role {
    return Object.values(ROLES).includes(role as Role);
}

/**
 * Generate a random org-code (8 chars, alphanumeric uppercase).
 */
export function generateOrgCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O/0/1/I/L to avoid confusion
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
