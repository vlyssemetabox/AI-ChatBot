import Link from 'next/link';
import { Search, FileSearch, Shield, MessageSquare, Upload, Brain, Zap, ArrowRight, ChevronRight, Users, Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
    {
        icon: FileSearch,
        title: 'Smart Document Search',
        description: 'Upload your documents and ask questions in natural language. Sherlock finds the answers instantly using advanced RAG.',
    },
    {
        icon: Building2,
        title: 'Team Organizations',
        description: 'Create or join an organization with a simple invite code. Share documents and knowledge across your entire team.',
    },
    {
        icon: Shield,
        title: 'Role-Based Access',
        description: 'Super Admin, Admin, and User roles control who can upload documents, change settings, and manage team members.',
    },
    {
        icon: MessageSquare,
        title: 'Chat History',
        description: 'All your conversations are saved and searchable. Pick up right where you left off, every time.',
    },
    {
        icon: Users,
        title: 'Team Management',
        description: 'Invite members, promote admins, and manage your team\'s access — all from a simple dashboard.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Built on Cerebras inference for blazing speed. Get answers in milliseconds, not seconds.',
    },
];

const steps = [
    { step: '01', title: 'Create Your Org', description: 'Set up your organization in seconds and invite your team with a private code.' },
    { step: '02', title: 'Upload Documents', description: 'Admins upload PDFs, docs, or text files — shared across the whole team instantly.' },
    { step: '03', title: 'Ask & Get Answers', description: 'Everyone in the org can chat and get cited answers from the shared knowledge base.' },
];


export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <Search className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-lg font-bold">Sherlock</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Get Started
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            Powered by Cerebras & Jina AI
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                            Your documents,{' '}
                            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                                answered instantly
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Sherlock is an AI-powered assistant for teams. Upload documents, share knowledge across your organization,
                            and get accurate answers with source citations — powered by role-based access control.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/auth/signup"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                                Start for Free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border font-medium text-base hover:bg-muted/50 transition-colors"
                            >
                                See how it works
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Everything you need</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            From document ingestion to intelligent answers — Sherlock handles the entire RAG pipeline.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-black/5 hover:border-primary/20 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Three simple steps to unlock your documents with AI.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {steps.map((s, i) => (
                            <div key={s.step} className="relative text-center space-y-4">
                                <div className="text-5xl font-black text-primary/10">{s.step}</div>
                                <h3 className="text-xl font-semibold">{s.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-8 -right-4 w-8">
                                        <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* CTA */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
                    <h2 className="text-3xl md:text-4xl font-bold">Ready to unlock your documents?</h2>
                    <p className="text-muted-foreground text-lg">
                        Create your organization, invite your team, and start getting AI-powered answers from your shared documents — free.
                    </p>
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                        Get Started for Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 bg-muted/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                <Search className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold">Sherlock</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Sherlock. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
