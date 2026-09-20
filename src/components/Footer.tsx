import React from 'react';
import { Gamepad2, Heart, MessageSquare, ShieldCheck, Wallet } from 'lucide-react';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY } from '../data/storeData';

interface FooterProps {
  onOpenChat?: () => void;
  onOpenOwnerPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenChat, onOpenOwnerPortal }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0a0a12] border-t border-white/10 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-2.5 text-white text-2xl font-black">
              <div className="p-2 rounded-xl gradient-bg text-white">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="gradient-text font-black">Medga Store</span>
            </a>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Egypt's premier destination for digital PlayStation games, PS Plus memberships, Fortnite V-Bucks, Rocket League credits, and social media growth.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Safe Accounts
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-purple-400" /> Telda & InstaPay
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider mb-4">Quick Store Navigation</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <button onClick={() => scrollToSection('games')} className="hover:text-purple-400 transition-colors cursor-pointer">
                  PlayStation Games
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('plus')} className="hover:text-purple-400 transition-colors cursor-pointer">
                  PS Plus Memberships
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('vbucks')} className="hover:text-purple-400 transition-colors cursor-pointer">
                  Fortnite V-Bucks
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('rocket')} className="hover:text-purple-400 transition-colors cursor-pointer">
                  Rocket League Credits
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('hezo')} className="hover:text-purple-400 transition-colors cursor-pointer">
                  Hezo Boosting
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div>
            <h4 className="text-white font-extrabold uppercase text-xs tracking-wider mb-4">Customer Support</h4>
            <p className="text-xs text-slate-400 mb-3">Questions about your order or account delivery?</p>
            <div className="space-y-2">
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs hover:bg-purple-600/50 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Chat With Us Live on Website</span>
                </button>
              )}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60 transition-colors"
              >
                <span>WhatsApp: {WHATSAPP_DISPLAY}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Store Owner Portal */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Medga Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {onOpenOwnerPortal && (
              <button
                type="button"
                onClick={onOpenOwnerPortal}
                className="hover:text-purple-400 underline underline-offset-2 transition-colors cursor-pointer text-[11px] font-semibold"
              >
                Store Owner Portal (Connect Paymob & Google Sheets)
              </button>
            )}
            <p className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the Egyptian Gaming Community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
