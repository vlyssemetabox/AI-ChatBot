import { db } from '@/lib/db/neon';
import { organizations, orgMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/utils';
import { getUserOrgMembership, ROLES } from '@/lib/auth/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/organizations/join
 * Join an existing organization via org-code. Auto-assigns Normal User role.
 */
export async function POST(req: Request) {
    try {
        const userId = await getUserId();

        // Check if user already belongs to an org
        const existing = await getUserOrgMembership(userId);
        if (existing) {
            return Response.json(
                { error: 'You already belong to an organization' },
                { status: 400 }
            );
        }

        const { orgCode } = await req.json();
        if (!orgCode || typeof orgCode !== 'string') {
            return Response.json(
                { error: 'Organization code is required' },
                { status: 400 }
            );
        }

        // Find the org by code
        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.orgCode, orgCode.trim().toUpperCase()))
            .limit(1);

        if (!org) {
            return Response.json(
                { error: 'Invalid organization code' },
                { status: 404 }
            );
        }

        // Add user as normal user
        await db.insert(orgMembers).values({
            orgId: org.id,
            userId,
            role: ROLES.USER,
        });

        return Response.json({
            organization: org,
            role: ROLES.USER,
        });
    } catch (error: any) {
        console.error('Join org error:', error);
        if (error.message.includes('Unauthorized')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('duplicate') || error.code === '23505') {
            return Response.json(
                { error: 'You are already a member of this organization' },
                { status: 400 }
            );
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}
