import React from 'react';
import { X, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRICING_PLANS } from '../lib/stripe';

function NovaLogo() {
  return (
    <svg
      aria-label="Nova"
      className="h-16 w-16 shrink-0"
      viewBox="0 0 40 40"
      role="img"
    >
      <defs>
        <linearGradient id="novaPricingBlueGreen" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.48" stopColor="#34a853" />
          <stop offset="1" stopColor="#1a73e8" />
        </linearGradient>
        <linearGradient id="novaPricingRedYellow" x1="8" y1="31" x2="29" y2="7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbc04" />
          <stop offset="0.44" stopColor="#ea4335" />
          <stop offset="1" stopColor="#4285f4" />
        </linearGradient>
      </defs>
      <path
        d="M21.3 4.9c.5-1.6 2.9-1.6 3.4 0l1.8 6.2c.2.6.7 1.1 1.3 1.3l6.2 1.8c1.6.5 1.6 2.9 0 3.4l-6.2 1.8c-.6.2-1.1.7-1.3 1.3l-1.8 6.2c-.5 1.6-2.9 1.6-3.4 0l-1.8-6.2c-.2-.6-.7-1.1-1.3-1.3L12 17.6c-1.6-.5-1.6-2.9 0-3.4l6.2-1.8c.6-.2 1.1-.7 1.3-1.3l1.8-6.2Z"
        fill="url(#novaPricingBlueGreen)"
      />
      <path
        d="M8.3 21.7c.3-1 1.8-1 2.1 0l.9 3.1c.1.4.4.7.8.8l3.1.9c1 .3 1 1.8 0 2.1l-3.1.9c-.4.1-.7.4-.8.8l-.9 3.1c-.3 1-1.8 1-2.1 0l-.9-3.1c-.1-.4-.4-.7-.8-.8l-3.1-.9c-1-.3-1-1.8 0-2.1l3.1-.9c.4-.1.7-.4.8-.8l.9-3.1Z"
        fill="url(#novaPricingRedYellow)"
      />
    </svg>
  );
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

export default function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <NovaLogo />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-display mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-gray-500">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Zap size={20} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{PRICING_PLANS.FREE.name}</h3>
                <p className="text-2xl font-bold text-gray-900">${PRICING_PLANS.FREE.price}</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.FREE.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              disabled
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-blue-500 p-6 relative bg-blue-50/50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{PRICING_PLANS.PRO.name}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  ${PRICING_PLANS.PRO.price}
                  <span className="text-sm font-normal text-gray-500">/{PRICING_PLANS.PRO.interval}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.PRO.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan(PRICING_PLANS.PRO.id)}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{PRICING_PLANS.ENTERPRISE.name}</h3>
                <p className="text-2xl font-bold text-gray-900">
                  ${PRICING_PLANS.ENTERPRISE.price}
                  <span className="text-sm font-normal text-gray-500">/{PRICING_PLANS.ENTERPRISE.interval}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.ENTERPRISE.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-purple-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan(PRICING_PLANS.ENTERPRISE.id)}
              className="w-full py-3 rounded-xl border border-purple-500 text-purple-600 font-semibold text-sm cursor-pointer hover:bg-purple-50 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            All plans include secure payment processing via Stripe. Cancel anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
