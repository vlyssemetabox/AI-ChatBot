'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.requestPasswordReset({
                email,
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to send reset email. Please try again.');
            } else {
                setIsSuccess(true);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                    <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Search className="w-6 h-6 text-primary" />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {isSuccess ? 'Check your email' : 'Forgot password?'}
                </h1>
                <p className="text-muted-foreground text-sm">
                    {isSuccess
                        ? `We sent a password reset link to ${email}`
                        : "Enter your email and we'll send you a reset link"
                    }
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                            Please check your spam folder if you don't see the email within a few minutes.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setIsSuccess(false)}
                        >
                            Try another email
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
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
                                    Sending link…
                                </>
                            ) : (
                                'Send reset link'
                            )}
                        </Button>
                    </form>
                )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}
