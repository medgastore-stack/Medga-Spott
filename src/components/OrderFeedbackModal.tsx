import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, CheckCircle2, MessageSquare, Send, ThumbsUp } from 'lucide-react';
import { Order, User, ToastType } from '../types';
import { submitOrderRating } from '../lib/orderUtils';

interface OrderFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  user: User;
  onSuccess: (rating: number, comment: string) => void;
  onShowToast: (msg: string, type?: ToastType) => void;
}

const RATING_LABELS = [
  'Select a rating',
  '1 - Needs Improvement',
  '2 - Fair',
  '3 - Good Experience',
  '4 - Very Good & Fast',
  '5 - Outstanding & Seamless!',
];

export const OrderFeedbackModal: React.FC<OrderFeedbackModalProps> = ({
  isOpen,
  onClose,
  order,
  user,
  onSuccess,
  onShowToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setRating(order.rating || 5);
      setComment(order.ratingComment || '');
      setSelectedItemIndex(0);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const activeRating = hoverRating || rating;
  const currentItem = order.items[selectedItemIndex] || order.items[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      onShowToast('Please write a short comment about your purchase experience.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOrderRating(
        order,
        rating,
        comment.trim(),
        user.name || order.userName || 'Verified Buyer',
        user.email || order.userEmail || ''
      );

      onShowToast('Order Rating submitted! Thank you for your feedback (+25 Points earned).', 'success');
      onSuccess(rating, comment.trim());
      onClose();
    } catch (err) {
      console.error(err);
      onShowToast('Failed to submit rating. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#151525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/20">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Order Rating</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  +25 Points
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Order #{order.orderNumber} • {order.status === 'Completed' ? 'Completed' : 'Delivered'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Item being reviewed */}
          {order.items.length > 1 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Which item are you reviewing?
              </label>
              <select
                value={selectedItemIndex}
                onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {order.items.map((it, idx) => (
                  <option key={idx} value={idx}>
                    {it.name} - {it.details}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Purchased Product</span>
                <span className="font-bold text-white">{currentItem?.name}</span>
                <span className="text-purple-400 ml-1.5 font-mono">({currentItem?.details})</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                {order.status === 'Completed' ? 'Completed' : 'Delivered'}
              </span>
            </div>
          )}

          {/* Interactive Star Rating */}
          <div className="space-y-2 text-center py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Rate Your Purchase (1 - 5 Stars)
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 rounded-xl hover:scale-125 active:scale-95 transition-all cursor-pointer"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-400 transition-all">
              {RATING_LABELS[activeRating] || 'Select your rating'}
            </p>
          </div>

          {/* Comment text area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Short Comment</span>
              <span className="text-[11px] text-slate-500">Short review for your order</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your purchase experience? Fast delivery, responsive support, smooth account activation?"
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-900 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 custom-scrollbar resize-none"
              required
            />
          </div>

          {/* Verified buyer assurance note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Your rating will be saved to your order and verified buyer review section with <strong>+25 Loyalty Points</strong>.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-lg shadow-amber-950/40 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Order Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
