import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  User,
  Package,
  Inbox,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Customer, Product, Enquiry, Communication, AiChatMessage } from '../types';

interface AiAgentViewProps {
  customers: Customer[];
  products: Product[];
  enquiries: Enquiry[];
  communications: Communication[];
  onOpenDraftReply: (enquiry: Enquiry) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectProduct: (product: Product) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
}

export const AiAgentView: React.FC<AiAgentViewProps> = ({
  customers,
  products,
  enquiries,
  communications,
  onOpenDraftReply,
  onSelectCustomer,
  onSelectProduct,
  onSelectEnquiry,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am your **AI Sales Assistant** for the electronics store.

I have direct access to your real store inventory, registered customers, sales enquiries, and Gmail communication history.

Try asking me questions such as:
- *"Show all pending enquiries"*
- *"What products are available below ₹50,000?"*
- *"Which customers asked about laptops?"*
- *"Find customers who have not received a response"*
- *"Suggest a suitable product based on Rahul's enquiry"*
- *"Which products have the most enquiries?"*`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const predefinedQueries = [
    'Show all pending enquiries',
    'What products are available below ₹50,000?',
    'Which customers asked about laptops?',
    'Find customers who have not received a response',
    'Show all enquiries about smartphones',
    'Which products have the most enquiries?',
    'Draft a response to Rahul',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentContext: {
            customers,
            products,
            enquiries,
            communications,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to query AI Sales Agent');
      }

      const data = await res.json();

      const assistantMessage: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I could not find matching information in your database.',
        timestamp: new Date().toISOString(),
        suggestedActions: data.suggestedActions || [],
        matchedData: data.matchedData || {},
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: AiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Sorry, an error occurred while processing your question: ${err.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: NonNullable<AiChatMessage['suggestedActions']>[0]) => {
    if (action.type === 'view_enquiry') {
      const found = enquiries.find((e) => e.id === action.targetId);
      if (found) onSelectEnquiry(found);
    } else if (action.type === 'view_customer') {
      const found = customers.find((c) => c.id === action.targetId);
      if (found) onSelectCustomer(found);
    } else if (action.type === 'view_product') {
      const found = products.find((p) => p.id === action.targetId);
      if (found) onSelectProduct(found);
    } else if (action.type === 'draft_reply') {
      const found = enquiries.find((e) => e.id === action.targetId || e.customerId === action.targetId);
      if (found) onOpenDraftReply(found);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              AI Sales Intelligence Agent
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Grounded on Live DB
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Natural language retrieval over {products.length} products, {enquiries.length} enquiries & {customers.length} customers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap flex items-center gap-2 shrink-0 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Suggestions:
        </span>
        {predefinedQueries.map((pq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pq)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-indigo-950/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-colors shrink-0 disabled:opacity-50"
          >
            {pq}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Container */}
              <div className="space-y-3 max-w-2xl">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none">
                    {msg.content}
                  </div>
                </div>

                {/* Interactive Entity Cards from AI Grounding */}
                {msg.matchedData && (
                  <div className="space-y-2">
                    {/* Matched Products */}
                    {msg.matchedData.products && msg.matchedData.products.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-400" />
                          Matched Inventory Products ({msg.matchedData.products.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.matchedData.products.map((p) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="overflow-hidden pr-2">
                                <p className="font-medium text-slate-200 truncate">{p.name}</p>
                                <p className="text-[11px] text-indigo-400 font-semibold">
                                  ₹{p.price.toLocaleString('en-IN')}{' '}
                                  <span className={`text-[10px] ml-1 font-normal ${
                                    p.availability === 'Available' ? 'text-emerald-400' : 'text-amber-400'
                                  }`}>
                                    ({p.availability})
                                  </span>
                                </p>
                              </div>
                              <button
                                onClick={() => onSelectProduct(p)}
                                className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Enquiries */}
                    {msg.matchedData.enquiries && msg.matchedData.enquiries.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Inbox className="w-3.5 h-3.5 text-amber-400" />
                          Matched Enquiries ({msg.matchedData.enquiries.length})
                        </div>
                        <div className="space-y-1.5">
                          {msg.matchedData.enquiries.map((e) => (
                            <div
                              key={e.id}
                              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="overflow-hidden pr-2">
                                <span className="font-medium text-slate-200">{e.customerName}</span>
                                <span className="text-slate-400 text-[11px] block truncate">
                                  "{e.enquiryText}"
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => onSelectEnquiry(e)}
                                  className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => onOpenDraftReply(e)}
                                  className="px-2 py-1 text-[11px] rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Actions Buttons */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(action)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {action.label}
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing store database and crafting answer...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask anything: 'Show pending enquiries', 'Which customers asked about laptops?', 'What products are available below ₹50,000?'"
            className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
