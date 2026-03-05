'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, MoreVertical, Pencil, Check, X } from 'lucide-react';
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const truncateTitle = (title: string, maxLen = 22) =>
        title.length > maxLen ? title.substring(0, maxLen) + '…' : title;

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

    // Auto-focus input when editing
    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== id));
                if (activeId === id) {
                    onSelect(null);
                }
            } else {
                const data = await res.json();
                console.error('Delete failed:', data.error);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const handleSaveRename = async (id: string) => {
        const trimmed = editTitle.trim();
        if (!trimmed) {
            setEditingId(null);
            return;
        }
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed }),
            });
            if (res.ok) {
                setConversations(prev =>
                    prev.map(c => (c.id === id ? { ...c, title: trimmed } : c))
                );
            }
        } catch (error) {
            console.error('Error renaming conversation:', error);
        } finally {
            setEditingId(null);
        }
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setEditTitle('');
    };

    return (
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full shrink-0 hidden md:flex overflow-hidden">
            <div className="p-4 border-b border-border shrink-0">
                <Button
                    onClick={() => onSelect(null)}
                    className="w-full gap-2 justify-start shadow-sm"
                    variant="default"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0 overflow-hidden">
                <div className="p-2 w-full overflow-hidden">
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
                                    onClick={() => editingId !== conv.id && onSelect(conv.id)}
                                    className={`flex items-center justify-between group p-2 rounded-md cursor-pointer transition-colors text-sm max-w-full overflow-hidden ${activeId === conv.id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: 'calc(100% - 28px)' }}>
                                        <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="flex flex-col" style={{ maxWidth: 'calc(100% - 24px)' }}>
                                            {editingId === conv.id ? (
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        ref={editInputRef}
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRename(conv.id);
                                                            if (e.key === 'Escape') handleCancelRename();
                                                        }}
                                                        className="text-sm bg-background border border-border rounded px-1.5 py-0.5 w-full text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={() => handleSaveRename(conv.id)}>
                                                        <Check className="w-3 h-3 text-green-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={handleCancelRename}>
                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="block text-sm leading-tight">{truncateTitle(conv.title)}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {editingId !== conv.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e: React.MouseEvent) => handleStartRename(e, conv)}
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e: React.MouseEvent) => handleDelete(e, conv.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
