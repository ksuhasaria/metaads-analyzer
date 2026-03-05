"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [provider, setProvider] = useState<'openai' | 'gemini'>('gemini');

    const { messages, sendMessage, status } = useChat({
        api: '/api/chat',
        body: { provider },
    } as any);

    const isLoading = status === 'streaming' || status === 'submitted';
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const content = input;
        setInput('');
        await sendMessage({ text: content });
    };

    const handleSuggestion = async (suggestion: string) => {
        if (isLoading) return;
        await sendMessage({ text: suggestion });
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all duration-300 z-50",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
                )}
            >
                <MessageSquare className="w-6 h-6" />
                {!isOpen && messages.length === 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-[#0a0b0f]" />
                )}
            </button>

            {/* Chat Panel */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[400px] bg-[#12141a] border-l border-[#252836] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out z-[100]",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-[#252836] flex items-center justify-between bg-[#1a1d26]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-3 border-r border-[#252836]">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">AI Analyst</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Online</span>
                                </div>
                            </div>
                        </div>

                        {/* Provider Toggle */}
                        <div className="flex items-center gap-1 bg-[#0a0b0f] p-1 rounded-lg border border-[#252836]">
                            <button
                                onClick={() => setProvider('openai')}
                                className={cn(
                                    "px-2 py-1 text-[10px] rounded transition-all font-bold",
                                    provider === 'openai'
                                        ? "bg-indigo-600 text-white"
                                        : "text-[#6b7280] hover:text-white"
                                )}
                            >
                                GPT-4o
                            </button>
                            <button
                                onClick={() => setProvider('gemini')}
                                className={cn(
                                    "px-2 py-1 text-[10px] rounded transition-all font-bold",
                                    provider === 'gemini'
                                        ? "bg-indigo-600 text-white"
                                        : "text-[#6b7280] hover:text-white"
                                )}
                            >
                                Gemini
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-[#6b7280] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0b0f]/50 scroll-smooth"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Bot className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">How can I help you today?</p>
                                <p className="text-xs text-[#6b7280] mt-1">Ask me about your campaign performance, ROAS, or spend.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full mt-4">
                                {[
                                    "What's my total spend today?",
                                    "Show me my top campaigns by ROAS",
                                    "List all active campaigns"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSuggestion(suggestion)}
                                        className="text-[11px] text-left px-3 py-2 rounded-lg bg-[#1a1d26] border border-[#252836] text-[#e8eaf0] hover:border-indigo-500/40 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m: any) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex items-start gap-3",
                                m.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                                m.role === 'user'
                                    ? "bg-indigo-600/10 border-indigo-600/20 shadow-inner"
                                    : "bg-white/5 border-white/10"
                            )}>
                                {m.role === 'user' ? <User className="w-4 h-4 text-indigo-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                m.role === 'user'
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-[#1a1d26] text-[#e8eaf0] border border-[#252836] rounded-tl-none"
                            )}>
                                {m.content}
                                {m.parts?.map((part: any, i: number) => {
                                    if (part.type === 'text') {
                                        return <div key={i}>{part.text}</div>;
                                    }
                                    if (part.type.startsWith('tool-')) {
                                        return (
                                            <div key={i} className="mt-2 p-2 bg-black/20 rounded font-mono text-[10px] text-indigo-300 border border-indigo-500/20">
                                                🛠️ Using tool: {part.type.replace('tool-', '')}
                                                {part.state === 'output-available' && (
                                                    <div className="text-emerald-400 mt-1">✓ Data received</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="bg-[#1a1d26] border border-[#252836] rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                <span className="text-xs text-[#6b7280]">AI is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#252836] bg-[#1a1d26]">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="w-full bg-[#0a0b0f] border border-[#252836] rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-[#4b5563] transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-[#4b5563] mt-3">
                        Analyzing real-time Meta Ads data via Prisma
                    </p>
                </div>
            </div>
        </>
    );
}
