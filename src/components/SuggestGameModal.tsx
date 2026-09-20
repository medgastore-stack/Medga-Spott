import React, { useState } from 'react';
import { X, Sparkles, Gamepad2, Layers, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { User, ToastType } from '../types';
import { addPoints } from '../lib/pointsUtils';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface SuggestGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onShowToast: (msg: string, type?: ToastType) => void;
}

export const SuggestGameModal: React.FC<SuggestGameModalProps> = ({
  isOpen,
  onClose,
  user,
  onShowToast,
}) => {
  const [type, setType] = useState<'game' | 'service'>('game');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('PS5');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please enter the name of the game or service.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const suggestionData = {
        type,
        title: title.trim(),
        platform,
        details: details.trim(),
        userEmail: user.email || 'guest@prososka.com',
        userName: user.name || 'Gamer',
        pointsAwarded: 50,
        createdAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await addDoc(collection(db, 'suggestions'), suggestionData);
        } catch (e) {
          console.warn('Firestore suggestion save warning:', e);
        }
      }

      // Award 50 points per user instruction
      await addPoints(
        50,
        'suggestion',
        `Suggestion: "${title.trim()}"`,
        user.email,
        user.name
      );

      setSubmitted(true);
      onShowToast(`Suggestion received! Our team will review it.`, 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Could not submit suggestion. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToWhatsApp = () => {
    const text = `Hello Medga Store! I would like to request this ${type === 'game' ? 'Game' : 'Service'}:\n\n` +
      `📌 Title: ${title}\n` +
      `🎮 Platform/Category: ${platform}\n` +
      (details ? `📝 Notes: ${details}\n` : '') +
      `Please let me know if you can add it and what the price would be. Thank you!`;

    window.open(`https://wa.me/201042240852?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#151525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Suggest a Game or Service</h3>
              <p className="text-xs text-slate-400">
                Help us expand the store catalog and get rewarded
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

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">Suggestion Received!</h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              We added <strong className="text-white font-bold">{title}</strong> to our wishlist review queue. Points have been credited to your balance!
            </p>
            <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleSendToWhatsApp}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <MessageSquare className="w-4 h-4" />
                Also notify on WhatsApp
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Type selector */}
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setType('game')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'game'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Request a Game
              </button>
              <button
                type="button"
                onClick={() => setType('service')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'service'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Request a Service
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {type === 'game' ? 'Game Name / Edition' : 'Service Name'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'game' ? 'e.g. Elden Ring Nightreign, FIFA 23...' : 'e.g. Discord Nitro, Spotify Family...'}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-900 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Platform / Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Target Platform / Category
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="PS5">PlayStation 5 (PS5)</option>
                <option value="PS4">PlayStation 4 (PS4)</option>
                <option value="PS Plus">PlayStation Plus Subscription</option>
                <option value="PC/Steam">PC / Steam / Epic</option>
                <option value="TikTok/Social">TikTok / Social Media Boost</option>
                <option value="In-Game Currency">V-Bucks / Credits / Currency</option>
                <option value="Other">Other Custom Service</option>
              </select>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Additional Notes / Target Budget (Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Preferred primary/secondary account, specific DLCs, or special requests..."
                className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white gradient-bg hover:opacity-90 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending...' : 'Submit Suggestion'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
