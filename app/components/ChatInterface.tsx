'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是AI助手，有什么可以帮你的吗？',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // 添加用户消息
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // 调用API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.concat(userMessage).map(({ role, content }) => ({
                        role,
                        content,
                    })),
                }),
            });

            if (!response.ok) throw new Error('请求失败');

            // 处理流式响应
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            // 创建一条空消息用于逐步填充
            const assistantMessageId = (Date.now() + 1).toString();
            setMessages((prev) => [
                ...prev,
                { id: assistantMessageId, role: 'assistant', content: '' },
            ]);

            let accumulatedContent = '';

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                accumulatedContent += chunk;

                // 更新消息内容（实现打字机效果）
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '抱歉，我遇到了一些问题，请稍后再试。',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 头部 */}
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-semibold flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-500" />
                    AI智能助手
                </h1>
                <button
                    onClick={() => setMessages([
                        {
                            id: 'welcome',
                            role: 'assistant',
                            content: '你好！我是AI助手，有什么可以帮你的吗？',
                        },
                    ])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    清空对话
                </button>
            </header>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-blue-600" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white border border-gray-200'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {message.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 输入框 */}
            <div className="bg-white border-t px-4 py-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="输入你的问题..."
                        disabled={isLoading}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}