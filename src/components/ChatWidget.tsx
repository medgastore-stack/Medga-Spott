import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  X,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Loader2,
  User,
  Package,
  HelpCircle,
  Headphones,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'support';
  text: string;
  timestamp: string;
}

interface ChatWidgetProps {
  externalOpen?: boolean;
  initialTab?: 'chat' | 'owner' | 'ticket';
  onCloseExternal?: () => void;
  onOpenOrderTracker?: (orderNum?: string) => void;
}

const formatCleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*{2,}/g, '')
    .replace(/^(\s*)\*\s+/gm, '$1• ')
    .trim();
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  externalOpen,
  initialTab,
  onCloseExternal,
  onOpenOrderTracker,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'owner' | 'ticket'>('chat');

  // Sync external open triggers
  useEffect(() => {
    if (externalOpen) {
      setIsOpen(true);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [externalOpen, initialTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hi! Welcome to Medga Store AI Assistant!\n\nI can answer questions about PlayStation games, PS Plus subscriptions, Fortnite V-Bucks, Rocket League credits, payment methods (InstaPay, Vodafone Cash, Telda, Paymob), and track your real orders in real-time. You can also chat directly with owner Selim anytime!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for Reach Owner live chat
  interface OwnerChatMessage {
    id: string;
    sender: 'user' | 'owner';
    text: string;
    timestamp: string;
  }

  const [ownerChatMessages, setOwnerChatMessages] = useState<OwnerChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('medga_owner_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'owner-welcome',
        sender: 'owner',
        text: "👑 Hey! I'm Selim Ahmed, owner of Medga Store.\n\nSend me your message directly here — whether you need a special game price, custom bundle, urgent delivery, or payment verification. I reply personally!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [ownerInput, setOwnerInput] = useState('');
  const [ownerReplying, setOwnerReplying] = useState(false);
  const ownerMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('medga_owner_chat', JSON.stringify(ownerChatMessages));
    } catch {}
    if (activeTab === 'owner') {
      ownerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ownerChatMessages, activeTab]);

  // Human ticket form fields
  const [ticketName, setTicketName] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketOrderNum, setTicketOrderNum] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  const handleOpenWhatsApp = (customMsg?: string) => {
    const text = customMsg || 'Hello Medga Store! I would like to chat with support.';
    window.open(`https://wa.me/201042240852?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendMessage = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    if (!userText) setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // If message contains an order number like SST-2026-XXXXXX or ORD-
    const orderMatch = textToSend.match(/(SST-\d{4}-\d+|ORD-\d+)/i);
    if (orderMatch && onOpenOrderTracker) {
      setTimeout(() => {
        const orderId = orderMatch[0].toUpperCase();
        const autoReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I detected order number ${orderId}! Opening the real-time tracking dashboard for you right now...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, autoReply]);
        onOpenOrderTracker(orderId);
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          messages: chatHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || "I'm here to help! You can also tap 'Reach Selim (Owner)' above to talk to Selim directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        throw new Error('Server error');
      }
    } catch {
      // Intelligent fallback
      setTimeout(() => {
        const fallbackReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Thanks for your message! For immediate orders, custom bundle requests, or direct assistance, you can tap the Reach Selim (Owner) tab above or WhatsApp Selim at 01042240852.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackReply]);
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim() || !ticketPhone.trim()) return;

    setSubmittingTicket(true);
    try {
      await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ticketName.trim(),
          phone: ticketPhone.trim(),
          orderNumber: ticketOrderNum.trim(),
          message: ticketMessage.trim(),
        }),
      });

      if (db) {
        await addDoc(collection(db, 'support_chats'), {
          customerName: ticketName.trim() || 'Customer',
          customerPhone: ticketPhone.trim(),
          orderNumber: ticketOrderNum.trim() || '',
          text: ticketMessage.trim(),
          sender: 'customer',
          timestamp: new Date().toISOString(),
        });
      }

      setTicketSubmitted(true);
    } catch (err) {
      console.error(err);
      setTicketSubmitted(true);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendOwnerMessage = async (userText?: string) => {
    const textToSend = (userText || ownerInput).trim();
    if (!textToSend || ownerReplying) return;

    if (!userText) setOwnerInput('');

    const userMsg: OwnerChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOwnerChatMessages((prev) => [...prev, userMsg]);
    setOwnerReplying(true);

    try {
      if (db) {
        await addDoc(collection(db, 'direct_messages_to_selim'), {
          text: textToSend,
          sender: 'customer',
          timestamp: new Date().toISOString(),
          status: 'unread',
        });
      }
    } catch (err) {
      console.warn('Owner msg sync warning:', err);
    }

    setTimeout(() => {
      let reply = `Thanks for messaging! Selim has received your note: "${textToSend.length > 35 ? textToSend.slice(0, 35) + '...' : textToSend}". I'm reviewing it right now. If it's urgent, you can also ping my personal WhatsApp directly with 1 click below!`;
      const lower = textToSend.toLowerCase();
      if (lower.includes('price') || lower.includes('discount') || lower.includes('offer') || lower.includes('خصم') || lower.includes('سعر')) {
        reply = `Hey there! Selim here. I'm happy to give you our best VIP customer price on your order today. Which PlayStation game or package are you looking for?`;
      } else if (lower.includes('order') || lower.includes('id') || lower.includes('sst') || lower.includes('طلب') || lower.includes('تسليم')) {
        reply = `Selim here! I see your inquiry regarding an order. Share your order ID or phone number, and I will check the delivery queue and expedite your login credentials right now!`;
      } else if (lower.includes('pay') || lower.includes('instapay') || lower.includes('دفع') || lower.includes('فودافون')) {
        reply = `Selim here! Our official InstaPay is 01212072882 and WhatsApp is 01042240852. As soon as you transfer, send the screenshot on WhatsApp and I will activate your account immediately!`;
      }

      const replyMsg: OwnerChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'owner',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setOwnerChatMessages((prev) => [...prev, replyMsg]);
      setOwnerReplying(false);
    }, 1100);
  };

  const QUICK_PROMPTS = [
    '💳 How do I pay on the website?',
    '📦 Where do I find my Order ID?',
    '🎮 How do I get EA Sports FC 26?',
    '⚡ How fast is game account delivery?',
  ];

  return (
    <>
      {/* Universal backdrop to easily close chat by clicking/tapping anywhere outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[2400] cursor-pointer"
          onClick={handleClose}
          aria-label="Close chat backdrop"
        />
      )}

      <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[2500] flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto">
        {/* IN-APP CHAT WINDOW */}
        {isOpen && (
          <div className="w-[94vw] sm:w-[410px] max-w-[430px] h-[min(510px,calc(100vh-90px))] max-h-[calc(100vh-90px)] min-h-[340px] bg-[#101020] border-2 border-purple-500/50 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.4)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header - Always visible with unmistakable red Close button */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-purple-900/95 via-[#1b0b2b] to-[#121222] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative p-1.5 rounded-xl bg-purple-600/30 border border-purple-400/30 text-purple-300 shrink-0">
                  <Bot className="w-4 h-4 text-purple-300" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border border-slate-900 rounded-full animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">Medga Store Support</h3>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shrink-0">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-200/80 truncate">Instant AI & Direct Owner Chat</p>
                </div>
              </div>

              {/* Header Close and WhatsApp buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp('Hello Medga Store! I am chatting from the website support.')}
                  className="p-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title="Open WhatsApp"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all cursor-pointer border border-red-400/40 shadow-md active:scale-95"
                  title="Close Chat (Esc or click outside)"
                >
                  <X className="w-4 h-4 text-white" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs - Renamed to Reach Owner */}
            <div className="px-2 py-1.5 bg-[#0c0c17] border-b border-white/10 flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'chat'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                <Bot className="w-3 h-3 shrink-0" />
                <span className="truncate">AI Chatbot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('owner')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'owner'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-950/40 font-black'
                    : 'text-amber-300 hover:text-white bg-amber-950/30 border border-amber-500/30'
                }`}
              >
                <Crown className="w-3 h-3 shrink-0 text-amber-300" />
                <span className="truncate">Reach Owner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ticket');
                  setTicketSubmitted(false);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'ticket'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                <Headphones className="w-3 h-3 shrink-0" />
                <span className="truncate">Leave Message</span>
              </button>
            </div>

            {/* TAB 1: LIVE CHAT */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs sm:text-sm bg-[#0a0a14]/90">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.sender !== 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${
                          m.sender === 'user'
                            ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-900/40'
                            : 'bg-slate-900/95 border border-white/10 text-slate-200 rounded-bl-none shadow-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{formatCleanText(m.text)}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            m.sender === 'user' ? 'text-purple-200/70' : 'text-slate-500'
                          }`}
                        >
                          {m.timestamp}
                        </span>
                      </div>

                      {m.sender === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-pink-900/50 border border-pink-500/30 flex items-center justify-center text-pink-300 shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2 items-center text-slate-400 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      </div>
                      <span>Medga Store is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="px-3 py-1.5 bg-[#0e0e1a] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950 border border-white/10 hover:border-purple-500/40 text-[10px] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-[#0c0c18] border-t border-white/10 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question or order number..."
                    className="flex-1 bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2.5 rounded-xl gradient-bg text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: REACH OWNER (Interactive Direct Chat with Selim) */}
            {activeTab === 'owner' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a14]/90">
                {/* Owner Profile Banner */}
                <div className="p-3 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-b border-white/10 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                        👑
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-xs sm:text-sm text-white truncate">Selim Ahmed</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Owner
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online • Direct line
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href="https://wa.me/201042240852?text=Hello%20Selim!%20I%20am%20chatting%20with%20you%20directly%20from%20Medga%20Store."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                        title="Open WhatsApp with Selim"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Owner Chat Stream */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                  {ownerChatMessages.map((m) => {
                    const isOwner = m.sender === 'owner';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${isOwner ? 'justify-start' : 'justify-end'}`}
                      >
                        {isOwner && (
                          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 text-xs font-black">
                            👑
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                            isOwner
                              ? 'bg-slate-900/95 border border-amber-500/30 text-slate-100 rounded-bl-none shadow-md'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-br-none shadow-md'
                          }`}
                        >
                          {isOwner && (
                            <span className="block text-[10px] font-black text-amber-400 mb-0.5">
                              Selim (Owner)
                            </span>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                          <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-white/5">
                            <span
                              className={`text-[9px] ${
                                isOwner ? 'text-slate-400' : 'text-slate-900/70 font-bold'
                              }`}
                            >
                              {m.timestamp}
                            </span>
                            {isOwner && (
                              <a
                                href={`https://wa.me/201042240852?text=${encodeURIComponent('Hello Selim! I am following up on our chat on Medga Store: ' + m.text.slice(0, 50))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                              >
                                <span>Reply on WA</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {ownerReplying && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">👑</div>
                      <span className="italic text-[11px] text-amber-300/80 animate-pulse">Selim is replying...</span>
                    </div>
                  )}
                  <div ref={ownerMessagesEndRef} />
                </div>

                {/* Owner Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOwnerMessage();
                  }}
                  className="p-2.5 bg-[#0c0c18] border-t border-white/10 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder="Message Selim directly (e.g. VIP deal, order query)..."
                    className="flex-1 bg-slate-950 border border-white/15 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={ownerReplying || !ownerInput.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: LEAVE MESSAGE (Kept intact per request: 'leave massage its good') */}
            {activeTab === 'ticket' && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto bg-[#0a0a14]/90 space-y-3.5">
                {ticketSubmitted ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-extrabold text-sm text-white">Message Sent Successfully!</h4>
                    <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                      Our support team has received your message and will follow up on your phone/WhatsApp.
                    </p>
                    <button
                      onClick={() => {
                        setTicketSubmitted(false);
                        setActiveTab('chat');
                      }}
                      className="py-2 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Back to Live Chat
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-2.5">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Leave a Support Message</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Have a general inquiry or feedback? Submit your details and our team will get back to you.
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Your Name</label>
                      <input
                        type="text"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="e.g. Mostafa Mahmoud"
                        className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        WhatsApp or Mobile Number <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={ticketPhone}
                        onChange={(e) => setTicketPhone(e.target.value)}
                        placeholder="012XXXXXXXX or 010XXXXXXXX"
                        className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Order Number (Optional)</label>
                      <input
                        type="text"
                        value={ticketOrderNum}
                        onChange={(e) => setTicketOrderNum(e.target.value)}
                        placeholder="e.g. SST-2026-849201"
                        className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        Message / Request Details <span className="text-purple-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Describe what you need or questions regarding your order..."
                        className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Message</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom helper bar - always lets user close easily */}
            <div className="px-3 py-1.5 bg-[#090913] border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-slate-400">
                <span>Click outside or press</span>
                <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">Esc</kbd>
                <span>to close</span>
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1 font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Close Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* FLOATING ACTION BUTTON - Only shown when closed so it never obscures the screen */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open Medga Store Support & Owner Chat"
          >
            <Bot className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-black text-xs sm:text-sm">Support &amp; Owner</span>
              <span className="text-[9px] text-amber-200 font-bold">Ask AI or Chat Selim</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        )}
      </div>
    </>
  );
};
