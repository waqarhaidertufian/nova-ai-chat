import React from 'react';
import { X, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRICING_PLANS } from '../lib/stripe';

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
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-display mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-6 hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <Zap size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{PRICING_PLANS.FREE.name}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${PRICING_PLANS.FREE.price}</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.FREE.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              disabled
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-blue-500 p-6 relative bg-blue-50/50 dark:bg-blue-950/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{PRICING_PLANS.PRO.name}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${PRICING_PLANS.PRO.price}
                  <span className="text-sm font-normal text-gray-500">/{PRICING_PLANS.PRO.interval}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.PRO.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
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
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-6 hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{PRICING_PLANS.ENTERPRISE.name}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${PRICING_PLANS.ENTERPRISE.price}
                  <span className="text-sm font-normal text-gray-500">/{PRICING_PLANS.ENTERPRISE.interval}</span>
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PRICING_PLANS.ENTERPRISE.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check size={16} className="text-purple-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan(PRICING_PLANS.ENTERPRISE.id)}
              className="w-full py-3 rounded-xl border border-purple-500 text-purple-600 dark:text-purple-400 font-semibold text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
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
