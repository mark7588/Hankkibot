import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Bot, User, Loader2 } from 'lucide-react';

// Mock function to simulate processing markdown (bold, lists, etc.)
// In a real app, you'd use a library like 'marked' or 'react-markdown'
const SimpleMarkdown = ({ text }) => {
    const formatText = (txt) => {
        // Simple bold formatting **text** -> <strong>text</strong>
        txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Simple list formatting * item -> <li>item</li>
        txt = txt.replace(/^\s*\*\s(.*)/gm, '<li>$1</li>');
        // Wrap list items in <ul>
        if (txt.includes('<li>')) {
            txt = `<ul>${txt}</ul>`;
        }
        return { __html: txt };
    };

    return <div dangerouslySetInnerHTML={formatText(text)} />;
};


const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Add a placeholder for the bot's response
        setMessages(prev => [...prev, { text: '', sender: 'bot' }]);
        
        try {
            const response = await fetch('http://localhost:5001/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input }),
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                const chunk = decoder.decode(value, { stream: true });
                
                // Process Server-Sent Events
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            if (json.token) {
                                setMessages(prev => {
                                    const lastMessage = prev[prev.length - 1];
                                    if (lastMessage && lastMessage.sender === 'bot') {
                                        return [
                                            ...prev.slice(0, -1),
                                            { ...lastMessage, text: lastMessage.text + json.token }
                                        ];
                                    }
                                    return prev;
                                });
                            }
                             if (json.error) {
                                setMessages(prev => {
                                     const lastMessage = prev[prev.length - 1];
                                     if (lastMessage && lastMessage.sender === 'bot') {
                                         return [
                                             ...prev.slice(0, -1),
                                             { ...lastMessage, text: `Error: ${json.error}`, isError: true }
                                         ];
                                     }
                                     return prev;
                                });
                             }
                        } catch (error) {
                            console.error("Failed to parse JSON chunk:", line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
             setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.sender === 'bot') {
                     return [
                         ...prev.slice(0, -1),
                         { text: "Failed to connect to the server. Please ensure the backend is running and reachable.", sender: 'bot', isError: true }
                     ];
                }
                return [...prev, { text: "Failed to connect to the server. Please ensure the backend is running and reachable.", sender: 'bot', isError: true }];
            });
        } finally {
            setIsLoading(false);
            // Ensure input is focused after response is complete
             setTimeout(() => inputRef.current?.focus(), 100);
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
         setTimeout(() => handleSend(), 100); // Allow state to update before sending
    }

    const WelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot size={48} className="mb-4 text-gray-400" />
            <h1 className="text-2xl font-semibold text-gray-700">Korean Food Cooking Assistant</h1>
            <p className="mt-2">Ask me anything about the provided Korean recipes!</p>
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                <button onClick={() => handleSuggestionClick("How do I make Kimchi Jjigae?")} className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-sm text-gray-700">How do I make Kimchi Jjigae?</p>
                </button>
                 <button onClick={() => handleSuggestionClick("What are the ingredients for Bulgogi?")} className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-sm text-gray-700">What are the ingredients for Bulgogi?</p>
                </button>
                 <button onClick={() => handleSuggestionClick("Can you give me the instructions for Bibimbap?")} className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-sm text-gray-700">Instructions for Bibimbap?</p>
                </button>
                 <button onClick={() => handleSuggestionClick("What kind of noodles are used in Japchae?")} className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors">
                    <p className="font-semibold text-sm text-gray-700">What noodles are in Japchae?</p>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            <header className="p-4 border-b bg-white">
                <h1 className="text-xl font-semibold text-gray-800">Korean Food Chatbot</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                 {messages.length === 0 ? <WelcomeScreen /> : 
                    messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'bot' && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.isError ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                                    <Bot size={20} />
                                </div>
                            )}
                            <div className={`max-w-xl p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : (msg.isError ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none')}`}>
                                <div className="prose prose-sm max-w-none">
                                    {msg.text ? <SimpleMarkdown text={msg.text} /> : <div className="flex items-center justify-center p-1"><Loader2 className="animate-spin" size={20} /></div>}
                                </div>
                            </div>
                            {msg.sender === 'user' && (
                                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))
                }
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 bg-white border-t">
                <div className="relative max-w-2xl mx-auto">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about a recipe..."
                        className="w-full p-3 pr-20 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default App;
