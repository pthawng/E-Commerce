import React, { useState, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, Send, Sparkles, ShoppingBag, ArrowRight, Trash2, RotateCcw, Gem,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAiChat } from './useAiChat';
import { AI_CHAT_LIMITS, SuggestedProduct } from './ai-chat.service';
import { MarkdownMessage } from './MarkdownMessage';

// ─── Luxury image fallback ────────────────────────────────────────────────────
const ProductImagePlaceholder: React.FC = () => (
  <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-zinc-100 via-stone-50 to-zinc-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center overflow-hidden">
    <Gem
      className="h-10 w-10 text-zinc-300 dark:text-zinc-600"
      aria-hidden
    />
    {/* Subtle shimmer overlay */}
    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 dark:from-white/0 dark:via-white/5 dark:to-white/0" />
  </div>
);

// ─── Product card ─────────────────────────────────────────────────────────────
const ProductCard: React.FC<{
  product: SuggestedProduct;
  index: number;
  msgId: string;
  onNavigate: (slug: string) => void;
}> = ({ product, index, msgId, onNavigate }) => (
  <motion.div
    key={`${msgId}-p-${product.slug}-${index}`}
    initial={{ opacity: 0, scale: 0.9, x: 20 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    transition={{ delay: 0.08 + index * 0.07 }}
    role="button"
    tabIndex={0}
    aria-label={`Xem sản phẩm ${product.name}`}
    className="flex-shrink-0 w-[190px] snap-start bg-white dark:bg-zinc-900 rounded-[1.25rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 group/card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    onClick={() => onNavigate(product.slug)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigate(product.slug);
      }
    }}
  >
    {product.imageUrl ? (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors pointer-events-none" />
      </div>
    ) : (
      <ProductImagePlaceholder />
    )}

    <div className="p-3.5 bg-white dark:bg-zinc-900">
      <h4 className="text-[10px] font-display font-bold uppercase tracking-[0.12em] line-clamp-2 text-zinc-900 dark:text-zinc-100 leading-snug">
        {product.name}
      </h4>
      {product.category && (
        <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider">
          {product.category}
          {product.material ? ` · ${product.material}` : ''}
        </p>
      )}
      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800 pt-2.5">
        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {product.price != null
            ? `${product.price.toLocaleString('vi-VN')} ₫`
            : 'Liên hệ'}
        </span>
        <div className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white group-hover/card:translate-x-0.5 transition-transform">
          <ArrowRight className="h-2.5 w-2.5" aria-hidden />
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const AiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, clearChat, lastFailedText, retryLast } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const charCount = inputValue.length;
  const charLimit = AI_CHAT_LIMITS.MESSAGE_MAX;
  const showCharCounter = charCount > charLimit * 0.8;

  // Scroll to bottom on new message or loading change
  useEffect(() => {
    const scrollToBottom = () => {
      if (!scrollRef.current) return;
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    };
    const id = setTimeout(() => requestAnimationFrame(scrollToBottom), 100);
    return () => clearTimeout(id);
  }, [messages, isLoading]);

  // Focus input when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ─── Safe-area aware positioning ──────────────────────────────────────────
  // Use inline style for env(safe-area-inset-bottom) — Tailwind can't generate this.
  // Falls back to 0px on browsers without safe-area support (non-iOS, desktop).
  const buttonStyle: React.CSSProperties = {
    right: '1.5rem',
    bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
  };
  const panelStyle: React.CSSProperties = {
    right: '1.5rem',
    bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))',
  };

  return (
    <>
      <motion.div
        className="fixed z-50"
        style={buttonStyle}
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 1, type: 'spring', damping: 15 }}
      >
        <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
          {/* ── Trigger Button ── */}
          <DialogPrimitive.Trigger asChild>
            <Button
              type="button"
              size="icon"
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI Ray Paradis'}
              className={cn(
                'h-14 w-14 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500 border-none group overflow-hidden relative',
                isOpen
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-primary text-primary-foreground hover:scale-110 active:scale-95',
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Online ping indicator */}
              {!isOpen && (
                <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5" aria-hidden>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-sm" />
                </span>
              )}
            </Button>
          </DialogPrimitive.Trigger>

          {/* ── Chat Panel ── */}
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <DialogPrimitive.Content asChild>
              <motion.div
                style={panelStyle}
                initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className={cn(
                  'fixed z-50 flex flex-col isolate outline-none',
                  // Width: fluid on mobile, fixed on sm+. Use dvw to avoid iOS Safari 100vw scrollbar issue.
                  'w-[calc(100dvw-2rem)] sm:w-[460px]',
                  // Height: use dvh to avoid bottom-bar resize jumps on mobile.
                  'h-[min(680px,82dvh)]',
                )}
              >
                <DialogPrimitive.Title className="sr-only">Ray Paradis Concierge</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Trò chuyện với trợ lý AI để được tư vấn trang sức và gợi ý sản phẩm.
                </DialogPrimitive.Description>

                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border-zinc-200/50 dark:border-zinc-800/50 bg-white/97 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:bg-zinc-950/97">

                  {/* ── Header ── */}
                  <div className="relative px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-primary dark:to-primary/60 flex items-center justify-center text-white shadow-lg overflow-hidden">
                          <Sparkles className="h-5 w-5" aria-hidden />
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                        </div>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" aria-label="Trực tuyến" />
                      </div>
                      <div>
                        <h3 className="font-display text-[13px] tracking-wider font-semibold text-zinc-900 dark:text-zinc-100">
                          Ray Paradis Concierge
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.15em]">
                            ● Trực tuyến
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={clearChat}
                        title="Xóa cuộc trò chuyện"
                        aria-label="Xóa cuộc trò chuyện"
                      >
                        <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.35 }}>
                          <Trash2 className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        </motion.div>
                      </Button>
                      <DialogPrimitive.Close asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          aria-label="Đóng khung chat"
                        >
                          <X className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        </Button>
                      </DialogPrimitive.Close>
                    </div>
                  </div>

                  {/* ── Messages ── */}
                  <ScrollArea
                    ref={scrollRef}
                    onWheel={(e) => e.stopPropagation()}
                    className="min-h-0 flex-1 px-4 py-5 [&_[data-radix-scroll-area-viewport]]:overscroll-contain [&_[data-radix-scroll-area-viewport]]:min-h-0"
                  >
                    <div className="space-y-6 pb-2">

                      {/* Empty state */}
                      {messages.length === 0 && (
                        <div className="text-center py-10 px-4 flex flex-col items-center">
                          <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-5 shadow-inner border border-zinc-100 dark:border-zinc-800">
                            <ShoppingBag className="h-7 w-7 text-zinc-400" aria-hidden />
                          </div>
                          <h4 className="font-display text-base mb-2 text-zinc-800 dark:text-zinc-200">
                            Tôi có thể giúp gì cho bạn?
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-7 max-w-[260px]">
                            Chuyên gia trang sức của chúng tôi sẵn sàng tư vấn cho bạn.
                          </p>
                          <div className="w-full space-y-2">
                            {[
                              'Nhẫn kim cương cho nam',
                              'Bông tai phong cách cổ điển',
                              'Chính sách bảo hành',
                            ].map((hint) => (
                              <button
                                key={hint}
                                type="button"
                                disabled={isLoading}
                                onClick={() => void sendMessage(hint)}
                                className="w-full text-[10px] text-center px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/40 hover:bg-primary/5 transition-all text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-[0.1em] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {hint}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message list */}
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={cn(
                            'flex flex-col',
                            msg.role === 'user' ? 'items-end' : 'items-start',
                          )}
                        >
                          <div
                            className={cn(
                              'flex flex-col gap-3',
                              msg.role === 'user' ? 'max-w-[82%]' : 'max-w-[94%]',
                            )}
                          >
                            {/* Bubble */}
                            <div
                              className={cn(
                                'relative px-4 py-3.5 shadow-sm',
                                msg.role === 'user'
                                  ? 'bg-zinc-900 dark:bg-primary text-white rounded-[1.25rem] rounded-tr-sm'
                                  : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-[1.25rem] rounded-tl-sm',
                              )}
                            >
                              {msg.role === 'user' ? (
                                <p className="text-sm leading-relaxed text-white [overflow-wrap:anywhere] [word-break:break-word]">
                                  {msg.content}
                                </p>
                              ) : (
                                <MarkdownMessage
                                  content={msg.content}
                                  className={cn(
                                    msg.role === 'model'
                                      ? 'text-zinc-800 dark:text-zinc-200'
                                      : 'text-white',
                                  )}
                                />
                              )}
                            </div>

                            {/* Product carousel */}
                            {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                              <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory touch-pan-x overscroll-x-contain">
                                {msg.suggestedProducts.map((product, pIdx) => (
                                  <ProductCard
                                    key={`${msg.id}-${product.slug}-${pIdx}`}
                                    product={product}
                                    index={pIdx}
                                    msgId={msg.id}
                                    onNavigate={(slug) => navigate(`/products/${slug}`)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Retry error banner */}
                      {lastFailedText && !isLoading && (
                        <div className="flex justify-center px-2">
                          <div className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300">
                            <span>Không gửi được tin nhắn.</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 rounded-xl gap-1.5 text-[11px]"
                              onClick={() => void retryLast()}
                            >
                              <RotateCcw className="h-3 w-3" aria-hidden />
                              Thử lại
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-[1.25rem] rounded-tl-sm px-4 py-3.5 flex flex-col gap-2">
                            <div className="flex gap-1.5 items-center">
                              {[0, 0.18, 0.36].map((delay, i) => (
                                <motion.span
                                  key={i}
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                  transition={{ repeat: Infinity, duration: 0.9, delay }}
                                  className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                                  aria-hidden
                                />
                              ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" aria-hidden />
                              Đang tìm kiếm sản phẩm...
                            </p>
                          </div>
                          <span className="sr-only">Đang chờ phản hồi từ AI</span>
                        </div>
                      )}

                    </div>
                  </ScrollArea>

                  {/* ── Input area ── */}
                  <div className="px-4 pt-3 pb-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
                    <div className="relative flex items-center gap-2.5">
                      <div className="relative flex-1 group">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          maxLength={charLimit}
                          placeholder="Hỏi tôi về trang sức..."
                          aria-label="Nội dung tin nhắn"
                          className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all outline-none font-body pr-12 placeholder:text-zinc-400"
                        />

                        {/* Enter shortcut hint */}
                        {!showCharCounter && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 group-focus-within:opacity-0 transition-opacity">
                            <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[9px] font-medium">
                              ↵
                            </kbd>
                          </div>
                        )}

                        {/* Character counter — only appears near limit */}
                        {showCharCounter && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span
                              className={cn(
                                'text-[10px] font-mono tabular-nums',
                                charCount > charLimit * 0.95
                                  ? 'text-destructive'
                                  : 'text-zinc-400',
                              )}
                            >
                              {charCount}/{charLimit}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        type="button"
                        className="h-12 w-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-primary dark:hover:bg-primary/90 flex-shrink-0 shadow-lg transition-all active:scale-95"
                        onClick={() => void handleSend()}
                        disabled={isLoading || !inputValue.trim()}
                        aria-label="Gửi tin nhắn"
                      >
                        <Send className="h-4 w-4 text-white" aria-hidden />
                      </Button>
                    </div>

                    {/* Disclaimer */}
                    <p className="mt-2.5 text-center text-[9px] leading-relaxed text-zinc-400 max-w-[300px] mx-auto">
                      Trợ lý AI có thể mắc lỗi. Thông tin mang tính gợi ý; với tư vấn chuyên sâu vui lòng liên hệ nhân viên.
                    </p>
                    <div className="mt-2.5 flex justify-center items-center gap-2">
                      <div className="h-px w-8 bg-zinc-100 dark:bg-zinc-900" />
                      <p className="text-[8px] uppercase tracking-[0.25em] text-zinc-300 dark:text-zinc-700 font-bold">
                        Ray Paradis AI Intelligence
                      </p>
                      <div className="h-px w-8 bg-zinc-100 dark:bg-zinc-900" />
                    </div>
                  </div>

                </Card>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </motion.div>
    </>
  );
};
