import React, { useState } from 'react';
import { X, Star, CheckCircle2, ThumbsUp, MessageSquare, Filter, Search, Sparkles } from 'lucide-react';
import { Review } from '../types';
import { getAllReviews } from '../lib/reviewsUtils';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterProductId?: string;
  filterProductTitle?: string;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  filterProductId,
  filterProductTitle,
}) => {
  const [reviews] = useState<Review[]>(() => getAllReviews());
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredReviews = reviews.filter((rev) => {
    if (filterProductId && rev.productId.toLowerCase() !== filterProductId.toLowerCase()) {
      return false;
    }
    if (selectedRating !== 'all' && rev.rating !== selectedRating) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rev.comment.toLowerCase().includes(q) ||
        rev.productTitle.toLowerCase().includes(q) ||
        rev.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fourStarCount = reviews.filter((r) => r.rating === 4).length;

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#151525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  {filterProductTitle ? `${filterProductTitle} Reviews` : 'Customer Reviews & Ratings'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Buyers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Read real experiences from gamers across Egypt before you buy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Summary Block */}
        <div className="p-5 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-blue-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-black text-white">{averageRating}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{totalReviews} Ratings</div>
            </div>
            <div className="h-12 w-px bg-white/10 hidden sm:block" />
            <div className="text-xs space-y-1 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">5 Stars:</span>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(fiveStarCount / totalReviews) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{fiveStarCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">4 Stars:</span>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(fourStarCount / Math.max(1, totalReviews)) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{fourStarCount}</span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-purple-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Verified
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Submit feedback on any delivered order
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3.5 border-b border-white/5 bg-[#141424] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments, games, buyers..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Rating:</span>
            <button
              onClick={() => setSelectedRating('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                selectedRating === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {[5, 4].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRating(r)}
                className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedRating === r
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{r}</span>
                <Star className="w-2.5 h-2.5 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No reviews match your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting another rating or clearing search.</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2.5 hover:border-purple-500/30 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xs">
                      {review.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>{review.authorName}</span>
                        {review.verifiedBuyer && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-300 font-medium">
                        Purchased: {review.productTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-10">
                  "{review.comment}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#121220] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Have you completed a purchase? Check <strong>My Orders</strong> to leave feedback!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl gradient-bg text-white font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
