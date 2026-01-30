import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, User, Bot, BookOpen, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);

        // Add user message
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);

        // Add placeholder for assistant message
        const assistantMessageIndex = newMessages.length;
        setMessages([...newMessages, { role: 'assistant', content: '', sources: [] }]);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages.slice(-6), // Last 3 exchanges
                }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            let sources = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.content) {
                                assistantContent += parsed.content;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[assistantMessageIndex] = {
                                        role: 'assistant',
                                        content: assistantContent,
                                        sources: sources,
                                    };
                                    return updated;
                                });
                            }

                            if (parsed.sources) {
                                sources = parsed.sources;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[assistantMessageIndex] = {
                                        role: 'assistant',
                                        content: assistantContent,
                                        sources: sources,
                                    };
                                    return updated;
                                });
                            }

                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                        } catch (err) {
                            console.error('Error parsing chunk:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: '❌ Error: ' + error.message,
                    sources: [],
                };
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (confirm('Clear all messages?')) {
            setMessages([]);
        }
    };

    return (
        <div className="chat-interface fade-in">
            <div className="chat-header">
                {messages.length > 0 && (
                    <button className="btn btn-secondary" onClick={clearChat}>
                        <Trash2 size={18} />
                        Clear Chat
                    </button>
                )}
            </div>

            <div className="chat-container glass-card">
                <div className="messages">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <div className="empty-icon">
                                <Bot size={64} strokeWidth={1.5} />
                            </div>
                            <h3>Start a conversation</h3>
                            <p>Upload documents and ask me anything!</p>
                            <div className="example-questions">
                                <p className="example-label">Try asking:</p>
                                <div className="example-question">"What is this document about?"</div>
                                <div className="example-question">"Summarize the key points"</div>
                                <div className="example-question">"What are the main conclusions?"</div>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className="message-content">
                                    <div className="message-text">
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="message-sources">
                                            <div className="sources-label">
                                                <BookOpen size={16} />
                                                Sources:
                                            </div>
                                            {msg.sources.map((source, i) => (
                                                <div key={i} className="source-tag">
                                                    {source.filename} (chunk {source.chunkIndex + 1})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="message assistant">
                            <div className="message-avatar">
                                <Bot size={20} />
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-form" onSubmit={sendMessage}>
                    <input
                        type="text"
                        className="input chat-input"
                        placeholder="Ask a question about your documents..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary send-btn"
                        disabled={loading || !input.trim()}
                    >
                        {loading ? <Loader2 size={18} className="spinner-icon" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatInterface;
