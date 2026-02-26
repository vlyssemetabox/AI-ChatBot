'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

interface ConversationSidebarProps {
    activeId: string | null;
    onSelect: (id: string | null) => void;
    triggerRefresh: number;
}

export function ConversationSidebar({ activeId, onSelect, triggerRefresh }: ConversationSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error('Failed to fetch conversations');
            const data = await res.json();
            setConversations(data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [triggerRefresh]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== id));
                if (activeId === id) {
                    onSelect(null);
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    return (
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full shrink-0 hidden md:flex">
            <div className="p-4 border-b border-border">
                <Button
                    onClick={() => onSelect(null)}
                    className="w-full gap-2 justify-start shadow-sm"
                    variant="default"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1 p-2">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No conversations yet
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`flex items-center justify-between group p-2 rounded-md cursor-pointer transition-colors text-sm ${activeId === conv.id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted text-foreground'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="truncate">{conv.title}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">
                                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={(e: React.MouseEvent) => handleDelete(e, conv.id)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
