'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Settings, Search, Loader2, LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChatView } from '@/components/ChatView';
import { SettingsView } from '@/components/SettingsView';
import { DocumentsView } from '@/components/DocumentsView';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { OrgSetup } from '@/components/OrgSetup';
import { authClient } from '@/lib/auth/client';
type View = 'chat' | 'settings' | 'documents';

interface BrandingSettings {
    company_name?: string;
    logo_url?: string;
    logo_dark_url?: string;
    faqs?: string[];
}

interface OrgData {
    organization: any;
    role: string | null;
}

export default function DashboardPage() {
    const [currentView, setCurrentView] = useState<View>('chat');
    const [isLoading, setIsLoading] = useState(true);
    const [branding, setBranding] = useState<BrandingSettings>({
        company_name: "Sherlock",
        logo_url: "",
        logo_dark_url: "",
        faqs: []
    });
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [triggerRefresh, setTriggerRefresh] = useState(0);
    const [orgData, setOrgData] = useState<OrgData>({ organization: null, role: null });
    const [orgLoading, setOrgLoading] = useState(true);

    // Fetch org context
    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const res = await fetch('/api/organizations');
                const data = await res.json();
                setOrgData({ organization: data.organization, role: data.role });
            } catch (err) {
                console.error('Failed to fetch org:', err);
            } finally {
                setOrgLoading(false);
            }
        };
        fetchOrg();
    }, []);

    // Fetch settings (only after org is loaded)
    useEffect(() => {
        if (orgLoading) return;
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data?.branding || data?.company_name) {
                    setBranding({
                        company_name: data.branding?.company_name || data.company_name || "Sherlock",
                        logo_url: data.branding?.logo_url || data.logo_url || "",
                        logo_dark_url: data.branding?.logo_dark_url || data.logo_dark_url || "",
                        faqs: data.faqs || []
                    });
                }
            } catch (error) {
                console.error("Failed to fetch branding:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [orgLoading]);

    // Dynamic Favicon Update
    useEffect(() => {
        if (isLoading) return;

        const updateFavicon = (url: string) => {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = url;
        };

        if (branding.logo_url) {
            updateFavicon(branding.logo_url);
        } else {
            updateFavicon('/favicon.ico');
        }
    }, [branding.logo_url, isLoading]);

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = '/';
        } catch (err) {
            console.error('Sign out failed:', err);
        }
    };

    const handleOrgComplete = () => {
        // Reload to get fresh org data
        window.location.reload();
    };

    // Role convenience checks
    const role = orgData.role;
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' || isSuperAdmin;

    // Logo Logic Helpers
    const hasLightLogo = !!branding.logo_url;
    const hasDarkLogo = !!branding.logo_dark_url;

    if (orgLoading || isLoading) {
        return (
            <div className="h-[100dvh] flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    // Show org setup if user has no organization
    if (!orgData.organization) {
        return <OrgSetup onComplete={handleOrgComplete} />;
    }

    return (
        <div className="h-[100dvh] flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="flex-none border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 md:px-6 h-16 max-w-7xl mx-auto w-full">
                    <h1
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => { setCurrentView('chat'); }}
                    >
                        {hasLightLogo ? (
                            <>
                                <img
                                    src={branding.logo_url}
                                    alt="Company Logo"
                                    className={`h-8 md:h-9 object-contain max-w-[150px] ${hasDarkLogo ? 'dark:hidden' : ''}`}
                                />
                                {hasDarkLogo && (
                                    <img
                                        src={branding.logo_dark_url}
                                        alt="Company Logo"
                                        className="h-8 md:h-9 object-contain max-w-[150px] hidden dark:block"
                                    />
                                )}
                            </>
                        ) : (
                            <img src="/sherlock.svg" alt="Sherlock Logo" className="h-8 md:h-9 object-contain dark:invert" />
                        )}

                        <span className="text-lg font-semibold hidden md:inline-block ml-2 text-foreground">
                            {branding.company_name}
                        </span>
                    </h1>

                    <div className="flex gap-1 items-center">
                        <ThemeToggle />

                        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                        <Button
                            variant={currentView === 'chat' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('chat')}
                            className="gap-2 transition-all"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat</span>
                        </Button>

                        {/* Documents tab — visible to all members, manage restricted to Admin+ */}
                        <Button
                            variant={currentView === 'documents' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('documents')}
                            className="gap-2 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Documents</span>
                        </Button>

                        {/* Settings tab — visible to Super Admin */}
                        {isSuperAdmin && (
                            <Button
                                variant={currentView === 'settings' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setCurrentView('settings')}
                                className="gap-2 transition-all"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Settings</span>
                            </Button>
                        )}



                        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            className="gap-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign out</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-row relative w-full h-full">
                {currentView === 'chat' && (
                    <ConversationSidebar
                        activeId={activeConversationId}
                        onSelect={setActiveConversationId}
                        triggerRefresh={triggerRefresh}
                    />
                )}
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                    <div className={currentView === 'chat' ? 'block h-full' : 'hidden'}>
                        <ChatView
                            companyName={branding.company_name}
                            logoUrl={branding.logo_url}
                            logoDarkUrl={branding.logo_dark_url}
                            faqs={branding.faqs}
                            activeConversationId={activeConversationId}
                            onConversationCreated={(id) => {
                                setActiveConversationId(id);
                                setTriggerRefresh(prev => prev + 1);
                            }}
                        />
                    </div>
                    <div className={currentView === 'documents' ? 'block h-full' : 'hidden'}>
                        <DocumentsView canManage={isAdmin} />
                    </div>
                    <div className={currentView === 'settings' ? 'block h-full' : 'hidden'}>
                        {isSuperAdmin && <SettingsView
                            isActive={currentView === 'settings'}
                            role={role || 'user'}
                            orgCode={isSuperAdmin ? orgData.organization?.orgCode : undefined}
                            orgName={orgData.organization?.name}
                            creatorId={orgData.organization?.createdBy}
                        />}
                    </div>
                </div>
            </main>
        </div>
    );
}
