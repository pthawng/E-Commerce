import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAiChat } from './useAiChat';

export const AiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  return (
    <>
      {/* Floating Toggle Button with Luxury Animation */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 1, type: 'spring', damping: 15 }}
      >
        <Button
          size="icon"
          className={cn(
            "h-16 w-16 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500 border-none group overflow-hidden",
            isOpen 
              ? "bg-zinc-900 text-white rotate-90" 
              : "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white hover:scale-110 active:scale-95"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Sparkles className="h-7 w-7" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isOpen && (
            <span className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-sm"></span>
            </span>
          )}
        </Button>
      </motion.div>

      {/* Chat Window Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed bottom-28 right-8 z-50 w-[calc(100vw-4rem)] sm:w-[420px] h-[650px] max-h-[80vh] flex flex-col"
          >
            <Card className="flex-1 flex flex-col overflow-hidden border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-2xl bg-white/95 dark:bg-zinc-950/95 rounded-[2rem]">
              
              {/* Premium Header */}
              <div className="relative p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-primary dark:to-primary/60 flex items-center justify-center text-white shadow-xl overflow-hidden group">
                      <Sparkles className="h-6 w-6 group-hover:scale-125 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 shadow-sm" />
                  </div>
                  <div>
                    <h3 className="font-display text-base tracking-luxury font-semibold text-zinc-900 dark:text-zinc-100">Ray Paradis Concierge</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.15em]">Expert is Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={clearChat} title="Clear history">
                    <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.4 }}>
                       <Sparkles className="h-3.5 w-3.5 opacity-40" />
                    </motion.div>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
                <div className="space-y-8 pb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 px-6 flex flex-col items-center">
                      <div className="h-20 w-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-6 shadow-inner border border-zinc-100 dark:border-zinc-800">
                        <ShoppingBag className="h-8 w-8 text-zinc-400" />
                      </div>
                      <h4 className="font-display text-lg mb-3 text-zinc-800 dark:text-zinc-200">How can I assist you today?</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-body mb-8 max-w-[280px]">
                        Our AI expert can help you find products, track orders, or provide styling advice.
                      </p>
                      
                      <div className="w-full space-y-2.5">
                        {["Nhẫn kim cương cho nam", "Bông tai phong cách cổ điển", "Chính sách bảo hành"].map((hint) => (
                          <button
                            key={hint}
                            onClick={() => {
                                setInputValue('');
                                sendMessage(hint);
                            }}
                            className="w-full text-[11px] text-center px-6 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/40 hover:bg-primary/5 transition-all text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-[0.12em]"
                          >
                            {hint}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={cn(
                        "flex flex-col",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "flex flex-col gap-3 group",
                        msg.role === 'user' ? "max-w-[80%]" : "max-w-[90%]"
                      )}>
                        <div
                          className={cn(
                            "relative px-5 py-4 text-sm leading-[1.6] font-body shadow-sm transition-all duration-300",
                            msg.role === 'user'
                              ? "bg-zinc-900 dark:bg-primary text-white rounded-[1.5rem] rounded-tr-none shadow-zinc-200/20 dark:shadow-primary/20"
                              : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[1.5rem] rounded-tl-none"
                          )}
                        >
                          <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            msg.role === 'user' ? "text-white" : ""
                          )}>
                            {msg.content}
                          </div>
                        </div>
                        
                        {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                          <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
                            {msg.suggestedProducts.map((product: any, pIdx: number) => (
                              <motion.div
                                key={pIdx}
                                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.1 + pIdx * 0.1 }}
                                className="flex-shrink-0 w-[200px] snap-start bg-white dark:bg-zinc-900 rounded-[1.25rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 group/card cursor-pointer"
                                onClick={() => window.location.href = `/products/${product.slug}`}
                              >
                                {product.imageUrl && (
                                  <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors" />
                                  </div>
                                )}
                                <div className="p-4 bg-white dark:bg-zinc-900">
                                  <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.15em] truncate text-zinc-900 dark:text-zinc-100">{product.name}</h4>
                                  <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">{product.category}</p>
                                  <div className="mt-3 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800 pt-3">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{product.price?.toLocaleString('vi-VN')} đ</span>
                                    <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white group-hover/card:translate-x-1 transition-transform">
                                      <ArrowRight className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl rounded-tl-none px-5 py-4 flex gap-1.5 items-center">
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Refined Input Area */}
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="relative flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none font-body pr-14"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-10 transition-opacity">
                       <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                          <span className="text-xs">↵</span>
                       </kbd>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl shadow-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-primary dark:hover:bg-primary/90 flex-shrink-0"
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <Send className="h-5 w-5 text-white" />
                  </Button>
                </div>
                <div className="mt-4 flex justify-center items-center gap-2">
                   <div className="h-[1px] w-8 bg-zinc-100 dark:bg-zinc-900" />
                   <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Ray Paradis AI Intelligence</p>
                   <div className="h-[1px] w-8 bg-zinc-100 dark:bg-zinc-900" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
