import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Gamepad2, Sparkles, ShoppingCart, Zap, Flame, Check, Heart } from 'lucide-react';
import { gamesData } from '../data/gamesData';
import { plusData, vBucksData, rocketData, hezoData } from '../data/storeData';
import { Game, WishlistItem } from '../types';
import { handleImageError } from '../utils/imageHelper';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo';
    icon?: string;
    image?: string;
  }) => void;
  onSelectCategorySection?: (sectionId: string) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
}

interface SearchResultItem {
  id: string;
  name: string;
  categoryName: string;
  categoryKey: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo';
  price: number;
  details: string;
  icon?: string;
  image?: string;
  badge?: string;
  rawObject?: any;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onSelectCategorySection,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo'>('all');
  const [addedId, setAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Combine all store products into a searchable catalog
  const allProducts = useMemo(() => {
    const list: SearchResultItem[] = [];

    // 1. Games
    gamesData.forEach((g) => {
      const price = g.prim5 ?? g.sec ?? g.prim4 ?? g.full ?? 0;
      list.push({
        id: `game-${g.id}`,
        name: g.name,
        categoryName: 'PlayStation Game',
        categoryKey: 'game',
        price,
        details: `${g.genre || 'PS4/PS5'} • Primary/Secondary`,
        icon: g.icon,
        image: g.image,
        badge: g.popular ? 'Bestseller' : 'PS Game',
        rawObject: g,
      });
    });

    // 2. PS Plus Tiers
    plusData.forEach((p) => {
      const basePrice = p.basePrices['12m_p'];
      list.push({
        id: `plus-${p.id}`,
        name: `PlayStation Plus ${p.name}`,
        categoryName: 'PS Plus Subscription',
        categoryKey: 'psplus',
        price: basePrice,
        details: '12 Months Primary Access',
        badge: p.badge,
      });
    });

    // 3. V-Bucks
    vBucksData.forEach((v) => {
      list.push({
        id: `vbucks-${v.id}`,
        name: `Fortnite ${v.amount.toLocaleString()} V-Bucks`,
        categoryName: 'Fortnite V-Bucks',
        categoryKey: 'vbucks',
        price: v.price,
        details: `${v.bonus} • Instant Direct Top-up`,
        badge: v.popular ? 'Best Value' : undefined,
      });
    });

    // 4. Rocket League
    rocketData.forEach((r) => {
      list.push({
        id: `rocket-${r.id}`,
        name: `Rocket League ${r.name}`,
        categoryName: 'Rocket League Credits',
        categoryKey: 'rocket',
        price: r.price,
        details: r.isPass ? 'Season Battle Pass' : 'Credits Top-up',
      });
    });

    // 5. Hezo Boost
    hezoData.forEach((h) => {
      list.push({
        id: `hezo-${h.id}`,
        name: `Hezo Social ${h.name} Boost`,
        categoryName: 'Hezo Social Boost',
        categoryKey: 'hezo',
        price: h.pricePer1k,
        details: `Starts from ${h.pricePer1k} EGP per 1,000 ${h.unit}`,
        badge: 'Social Growth',
      });
    });

    return list;
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim() && selectedFilter === 'all') {
      // Return top featured picks when empty
      return allProducts.slice(0, 8);
    }

    const q = query.toLowerCase().trim();
    return allProducts.filter((p) => {
      const matchesFilter = selectedFilter === 'all' || p.categoryKey === selectedFilter;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [allProducts, query, selectedFilter]);

  if (!isOpen) return null;

  const handleAddProduct = (item: SearchResultItem) => {
    onAddToCart({
      name: item.name,
      details: item.details,
      price: item.price,
      category: item.categoryKey,
      icon: item.icon,
      image: item.image,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#141424] border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(124,58,237,0.3)] flex flex-col max-h-[82vh]">
        {/* Netflix Search Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#18182d] flex items-center gap-3">
          <Search className="w-6 h-6 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search PS5 games, PS Plus, V-Bucks, Rocket League, Hezo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-400 font-semibold text-base sm:text-lg focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="px-4 py-3 bg-[#111120] border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All Catalog' },
            { key: 'game', label: '🎮 Games' },
            { key: 'psplus', label: '⚡ PS Plus' },
            { key: 'vbucks', label: '🪙 V-Bucks' },
            { key: 'rocket', label: '🚀 Rocket' },
            { key: 'hezo', label: '🚀 Hezo Boost' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedFilter(cat.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === cat.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 scale-105'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {!query && (
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Trending & Quick Search Suggestions</span>
            </div>
          )}

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-lg">No products found for "{query}"</p>
              <p className="text-slate-500 text-xs mt-1">Try searching "FC 26", "GTA", "PS Plus", or "V-Bucks"</p>
            </div>
          ) : (
            searchResults.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-purple-500/40 hover:bg-slate-800/80 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-14 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xl font-black shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    {item.image ? (
                      <img
                        src={item.image}
                        onError={handleImageError}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : item.icon ? (
                      <span className="text-2xl">{item.icon}</span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/20">
                        {item.categoryName}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-white text-sm sm:text-base truncate mt-1">{item.name}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <span className="text-sm sm:text-base font-black text-amber-400 block">{item.price} EGP</span>
                  </div>

                  {onToggleWishlist && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleWishlist({
                          id: item.id,
                          productId: item.id.replace(/^(game-|plus-|vb-|rc-|hezo-)/, ''),
                          name: item.name,
                          category: item.categoryKey,
                          price: item.price,
                          details: item.details,
                          icon: item.icon,
                          image: item.image,
                        });
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isWishlisted && isWishlisted(item.id)
                          ? 'bg-pink-950/80 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                          : 'bg-slate-900 border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-400'
                      }`}
                      title={isWishlisted && isWishlisted(item.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted && isWishlisted(item.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>
                  )}

                  <button
                    onClick={() => handleAddProduct(item)}
                    className={`p-2.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      addedId === item.id
                        ? 'bg-emerald-500 text-slate-950 scale-105'
                        : 'gradient-bg text-white hover:opacity-90 shadow-md shadow-purple-950/50'
                    }`}
                  >
                    {addedId === item.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
