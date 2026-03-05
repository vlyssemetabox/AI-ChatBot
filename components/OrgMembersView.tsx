'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, Shield, ShieldCheck, User, UserMinus, LogOut, Trash2, FolderLock, Pencil, Plus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Member {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    name: string;
    email: string;
    image: string | null;
    authorizedDepartmentIds: string[];
}

interface Department {
    id: string;
    name: string;
}

interface OrgMembersViewProps {
    role: string;
    orgCode?: string;
    orgName?: string;
    creatorId?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
    super_admin: { label: 'Super Admin', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: ShieldCheck },
    admin: { label: 'Admin', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Shield },
    user: { label: 'User', color: 'bg-muted text-muted-foreground border-border', icon: User },
};

export function OrgMembersView({ role, orgCode, orgName, creatorId }: OrgMembersViewProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [destroyLoading, setDestroyLoading] = useState(false);
    const [destroyConfirmName, setDestroyConfirmName] = useState('');
    const [showDestroyDialog, setShowDestroyDialog] = useState(false);

    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin';
    const isAdminOrSuperAdmin = isSuperAdmin || isAdmin;

    // Dept management state
    const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptName, setDeptName] = useState('');
    const [deptLoading, setDeptLoading] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
    const [isDeletingDept, setIsDeletingDept] = useState(false);

    useEffect(() => {
        fetchMembers();
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('/api/departments');
            const data = await res.json();
            if (data.departments) setDepartments(data.departments);
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/organizations/members');
            const data = await res.json();
            if (data.members) setMembers(data.members);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const changeRole = async (memberId: string, newRole: string) => {
        setActionLoading(memberId);
        try {
            const res = await fetch('/api/organizations/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, newRole }),
            });
            if (res.ok) await fetchMembers();
        } catch (err) {
            console.error('Failed to change role:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleDepartmentAccess = async (userId: string, departmentId: string, grant: boolean) => {
        // Optimistic UI update
        setMembers(current => current.map(m => {
            if (m.userId === userId) {
                const newIds = grant
                    ? [...(m.authorizedDepartmentIds || []), departmentId]
                    : (m.authorizedDepartmentIds || []).filter(id => id !== departmentId);
                return { ...m, authorizedDepartmentIds: newIds };
            }
            return m;
        }));

        try {
            const res = await fetch('/api/organizations/members/access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    departmentId,
                    action: grant ? 'grant' : 'revoke'
                }),
            });
            if (!res.ok) {
                // Revert on failure
                fetchMembers();
            }
        } catch (err) {
            console.error('Failed to toggle access:', err);
            fetchMembers();
        }
    };

    const removeMember = async (memberId: string) => {
        setActionLoading(memberId);
        try {
            const res = await fetch('/api/organizations/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            if (res.ok) await fetchMembers();
        } catch (err) {
            console.error('Failed to remove member:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const copyCode = () => {
        if (orgCode) {
            navigator.clipboard.writeText(orgCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpenCreateDept = () => {
        setEditingDept(null);
        setDeptName('');
        setIsDeptDialogOpen(true);
    };

    const handleOpenEditDept = (dept: Department) => {
        setEditingDept(dept);
        setDeptName(dept.name);
        setIsDeptDialogOpen(true);
    };

    const handleSaveDepartment = async () => {
        if (!deptName.trim()) return;
        setDeptLoading(true);
        try {
            const method = editingDept ? 'PATCH' : 'POST';
            const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: deptName.trim() }),
            });

            if (res.ok) {
                await fetchDepartments();
                setIsDeptDialogOpen(false);
                setDeptName('');
                setEditingDept(null);
            } else {
                const data = await res.json();
                console.error(data.error);
            }
        } catch (err) {
            console.error('Failed to save department:', err);
        } finally {
            setDeptLoading(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!deptToDelete) return;
        setIsDeletingDept(true);
        try {
            const res = await fetch(`/api/departments/${deptToDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchDepartments();
                setMembers(current => current.map(m => ({
                    ...m,
                    authorizedDepartmentIds: m.authorizedDepartmentIds?.filter(id => id !== deptToDelete.id) || []
                })));
                setDeptToDelete(null);
            }
        } catch (err) {
            console.error('Failed to delete department:', err);
        } finally {
            setIsDeletingDept(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Org Code Section (Super Admin only) */}
            {isSuperAdmin && orgCode && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Invite Code</p>
                        <p className="text-xs text-muted-foreground">Share this code with team members</p>
                    </div>
                    <code className="font-mono text-lg font-bold tracking-widest text-foreground px-3 py-1 rounded bg-background border">
                        {orgCode}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyCode}>
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            )}

            {/* Main Content Area */}
            {isAdminOrSuperAdmin ? (
                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-4">
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Access</TableHead>
                                        <TableHead className="hidden sm:table-cell">Joined</TableHead>
                                        {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => {
                                        const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.user;
                                        const RoleIcon = config.icon;

                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <p className="font-medium text-foreground">{member.name}</p>
                                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                                        </div>
                                                        {member.userId === creatorId && (
                                                            <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1.5 py-0.5">
                                                                <Crown className="w-3 h-3" />
                                                                Creator
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isSuperAdmin && member.userId !== creatorId ? (
                                                        <Select
                                                            value={member.role}
                                                            onValueChange={(val) => changeRole(member.id, val)}
                                                            disabled={actionLoading === member.id}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="user">User</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Badge variant="outline" className={`gap-1 ${config.color}`}>
                                                            <RoleIcon className="w-3 h-3" />
                                                            {config.label}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                        {departments.filter(d => member.authorizedDepartmentIds?.includes(d.id)).map(d => (
                                                            <Badge key={d.id} variant="secondary" className="text-xs">{d.name}</Badge>
                                                        ))}
                                                        {(!member.authorizedDepartmentIds || member.authorizedDepartmentIds.length === 0) && (
                                                            <span className="text-xs text-muted-foreground italic">No access</span>
                                                        )}
                                                    </div>
                                                    {isSuperAdmin && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                                                    <FolderLock className="w-3 h-3" /> Manage Access
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-48">
                                                                <DropdownMenuLabel>Department Access</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {departments.map((dept) => {
                                                                    const hasAccess = member.authorizedDepartmentIds?.includes(dept.id);
                                                                    return (
                                                                        <DropdownMenuCheckboxItem
                                                                            key={dept.id}
                                                                            checked={hasAccess}
                                                                            onCheckedChange={(checked) => toggleDepartmentAccess(member.userId, dept.id, checked)}
                                                                        >
                                                                            {dept.name}
                                                                        </DropdownMenuCheckboxItem>
                                                                    )
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                                    {new Date(member.joinedAt).toLocaleDateString()}
                                                </TableCell>
                                                {isSuperAdmin && (
                                                    <TableCell className="text-right">
                                                        {member.userId !== creatorId && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-muted-foreground hover:text-destructive"
                                                                        disabled={actionLoading === member.id}
                                                                    >
                                                                        <UserMinus className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will remove them from the organization. They can rejoin using the invite code.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => removeMember(member.id)}>
                                                                            Remove
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            {members.length} member{members.length !== 1 ? 's' : ''} in this organization
                        </p>
                    </TabsContent>

                    <TabsContent value="departments" className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">Manage Departments</h2>
                            <Button onClick={handleOpenCreateDept} size="sm" className="gap-2">
                                <Plus className="w-4 h-4" /> New Department
                            </Button>
                        </div>
                        <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Department Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                No departments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : departments.map((dept) => (
                                        <TableRow key={dept.id}>
                                            <TableCell className="font-medium">{dept.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDept(dept)} className="text-muted-foreground hover:text-foreground">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeptToDelete(dept)} className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => {
                                    const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.user;
                                    const RoleIcon = config.icon;

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-foreground">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`gap-1 ${config.color}`}>
                                                    <RoleIcon className="w-3 h-3" />
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {departments.filter(d => member.authorizedDepartmentIds?.includes(d.id)).map(d => (
                                                        <Badge key={d.id} variant="secondary" className="text-xs">{d.name}</Badge>
                                                    ))}
                                                    {(!member.authorizedDepartmentIds || member.authorizedDepartmentIds.length === 0) && (
                                                        <span className="text-xs text-muted-foreground italic">No access</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                                {new Date(member.joinedAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        {members.length} member{members.length !== 1 ? 's' : ''} in this organization
                    </p>
                </div>
            )}

            {/* Leave Organization — Normal User / Admin only */}
            {
                !isSuperAdmin && (
                    <div className="pt-4 border-t border-border">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                                    disabled={leaveLoading}
                                >
                                    {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    Leave Organization
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Leave this organization?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You will lose access to all shared documents and settings. You can rejoin later using the invite code.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={async () => {
                                            setLeaveLoading(true);
                                            try {
                                                const res = await fetch('/api/organizations/leave', { method: 'POST' });
                                                if (res.ok) window.location.reload();
                                            } catch (err) {
                                                console.error('Failed to leave:', err);
                                            } finally {
                                                setLeaveLoading(false);
                                            }
                                        }}
                                    >
                                        Leave
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            }

            {/* Destroy Organization — Super Admin only */}
            {
                isSuperAdmin && (
                    <div className="pt-4 border-t border-border space-y-3">
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-destructive" />
                                <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Permanently destroy this organization and all its data — documents, embeddings, settings, and usage logs. This action <strong>cannot be undone</strong>.
                            </p>

                            <AlertDialog open={showDestroyDialog} onOpenChange={(open) => { setShowDestroyDialog(open); if (!open) setDestroyConfirmName(''); }}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full gap-2"
                                        disabled={destroyLoading}
                                    >
                                        {destroyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Destroy Organization
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive">Destroy Organization?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete <strong>{orgName}</strong> and all associated data. Type the organization name below to confirm.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-2">
                                        <input
                                            type="text"
                                            placeholder={orgName || 'Organization name'}
                                            value={destroyConfirmName}
                                            onChange={(e) => setDestroyConfirmName(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={destroyConfirmName !== orgName || destroyLoading}
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                setDestroyLoading(true);
                                                try {
                                                    const res = await fetch('/api/organizations', { method: 'DELETE' });
                                                    if (res.ok) window.location.reload();
                                                } catch (err) {
                                                    console.error('Failed to destroy:', err);
                                                } finally {
                                                    setDestroyLoading(false);
                                                    setShowDestroyDialog(false);
                                                }
                                            }}
                                        >
                                            {destroyLoading ? 'Destroying…' : 'Destroy Forever'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )
            }

            {/* Dialogs for Department CRUD */}
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
                        <DialogDescription>
                            {editingDept ? 'Update the name of this department.' : 'Add a new department partition to organize your documents.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="dept-name">Department Name</Label>
                        <Input
                            id="dept-name"
                            value={deptName}
                            onChange={(e) => setDeptName(e.target.value)}
                            placeholder="e.g. Sales, HR, Engineering"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDepartment} disabled={!deptName.trim() || deptLoading}>
                            {deptLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingDept ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deptToDelete} onOpenChange={(open: boolean) => !open && setDeptToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Department?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the "{deptToDelete?.name}" department?
                            This will also permanently delete all documents and their vector embeddings currently partitioned here.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDepartment} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isDeletingDept ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Delete Department'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
