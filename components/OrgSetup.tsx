'use client';

import { useState } from 'react';
import { Building2, Users, Copy, Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface OrgSetupProps {
    onComplete: () => void;
}

export function OrgSetup({ onComplete }: OrgSetupProps) {
    const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
    const [orgName, setOrgName] = useState('');
    const [orgCode, setOrgCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!orgName.trim() || orgName.trim().length < 2) {
            setError('Organization name must be at least 2 characters');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: orgName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create organization');

            setCreatedCode(data.organization.orgCode);
            setMode('choose'); // Will show success screen
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!orgCode.trim()) {
            setError('Please enter an organization code');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/organizations/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgCode: orgCode.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to join organization');

            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(createdCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Success screen after creating
    if (createdCode) {
        return (
            <div className="h-[100dvh] flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full p-8 space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Organization Created!</h2>
                    <p className="text-muted-foreground">
                        Share this code with your team members so they can join:
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                        <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg text-foreground">
                            {createdCode}
                        </code>
                        <Button variant="ghost" size="icon" onClick={copyCode}>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <Button onClick={onComplete} className="w-full gap-2">
                        Continue to Dashboard <ArrowRight className="w-4 h-4" />
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] flex items-center justify-center bg-background p-4">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Welcome to Sherlock</h1>
                    <p className="text-muted-foreground text-lg">
                        {mode === 'choose'
                            ? 'Create or join an organization to get started'
                            : mode === 'create'
                                ? 'Set up your new organization'
                                : 'Enter your team\'s invite code'}
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {mode === 'choose' && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card
                            className="p-6 cursor-pointer hover:border-primary/50 transition-colors group"
                            onClick={() => { setMode('create'); setError(''); }}
                        >
                            <div className="space-y-4 text-center">
                                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Building2 className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Create Organization</h3>
                                <p className="text-sm text-muted-foreground">
                                    Start a new team and invite members with a private code
                                </p>
                            </div>
                        </Card>
                        <Card
                            className="p-6 cursor-pointer hover:border-primary/50 transition-colors group"
                            onClick={() => { setMode('join'); setError(''); }}
                        >
                            <div className="space-y-4 text-center">
                                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Users className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Join Organization</h3>
                                <p className="text-sm text-muted-foreground">
                                    Enter an invite code to join your team&apos;s workspace
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {mode === 'create' && (
                    <Card className="p-6 max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input
                                id="org-name"
                                placeholder="e.g. Acme Corp"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => { setMode('choose'); setError(''); }}>
                                Back
                            </Button>
                            <Button onClick={handleCreate} disabled={isLoading} className="flex-1 gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                                Create Organization
                            </Button>
                        </div>
                    </Card>
                )}

                {mode === 'join' && (
                    <Card className="p-6 max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-code">Organization Code</Label>
                            <Input
                                id="org-code"
                                placeholder="e.g. ABCD1234"
                                value={orgCode}
                                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                className="font-mono tracking-widest text-center text-lg"
                                maxLength={8}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => { setMode('choose'); setError(''); }}>
                                Back
                            </Button>
                            <Button onClick={handleJoin} disabled={isLoading} className="flex-1 gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                Join Organization
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
