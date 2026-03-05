import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";

export const metadata: Metadata = {
    title: 'Sherlock — AI Document Assistant',
    description: 'AI-powered RAG chatbot that reads your documents and answers questions with source citations.',
    icons: {
        icon: '/sherlock.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <PostHogProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </PostHogProvider>
            </body>
        </html>
    );
}
