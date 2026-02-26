'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Lock, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Some auth providers use a token in URL or rely on cookies if the user clicked the link
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Neon/Better Auth reset — token comes from the email callback URL
            const result = await authClient.resetPassword({
                newPassword: password,
                token: token ?? undefined,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to reset password. Link might be expired.');
            } else {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push('/auth/login');
                }, 3000);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold">Password updated!</h2>
                <p className="text-sm text-center text-muted-foreground">
                    Your password has been successfully reset. Redirecting to login...
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resetting…
                    </>
                ) : (
                    'Reset Password'
                )}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                    <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Search className="w-6 h-6 text-primary" />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Set new password
                </h1>
                <p className="text-muted-foreground text-sm">
                    Enter your new secure password below
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5">
                <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
