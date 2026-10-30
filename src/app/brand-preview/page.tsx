'use client';

import { useState, useEffect } from 'react';
import DashboardLayout, { SidebarBrandHeader, BRAND_VARIANT_LABELS } from '@/app/components/DashboardLayout';
import { useTheme } from 'next-themes';
import { CheckCircle2, Sun, Moon, Sparkles } from 'lucide-react';

const VARIANT_DESCRIPTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Gold-framed 40×40 jewel container with warm ambient glow, Merriweather metallic gold serif title ("The Golden Fork"), and micro-tracked "HOSPITALITY ENTERPRISE" subtitle.',
  2: 'Tactile Linear/Stripe-inspired floating workspace card with Space Grotesk typography, live emerald status indicator, "{Role} Workspace" subtitle, and dual-chevron icon.',
  3: 'Bespoke dark-obsidian & gold vector Fork-and-Knife crest badge with stacked "THE" / "GOLDEN FORK" geometric lettering and a champagne gold hairline divider.',
  4: 'Always-dark executive luxury banner card with radial gold spotlight, gold-ringed logo, champagne "HQ" pill badge, and "EXECUTIVE CRM" subtitle.',
  5: 'Crisp minimalist vector emblem (no raw JPEG box) paired with tight-tracked Lexend "GoldenFork.crm" and "REVENUE & OPS OS" subtitle.',
};

export default function BrandPreviewPage() {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5>(1);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem('gf_brand_variant');
    if (saved && ['1', '2', '3', '4', '5'].includes(saved)) {
      setSelected(Number(saved) as 1 | 2 | 3 | 4 | 5);
    }
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<1 | 2 | 3 | 4 | 5>;
      if (ce.detail) setSelected(ce.detail);
    };
    window.addEventListener('gf-brand-variant-change', onCustom);
    return () => window.removeEventListener('gf-brand-variant-change', onCustom);
  }, []);

  const choose = (v: 1 | 2 | 3 | 4 | 5) => {
    setSelected(v);
    window.localStorage.setItem('gf_brand_variant', String(v));
    window.dispatchEvent(new CustomEvent('gf-brand-variant-change', { detail: v }));
  };

  return (
    <DashboardLayout role="Manager">
      <div className="w-full space-y-6">
        <div className="spatial-glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
              <Sparkles size={13} /> Live Sidebar Brand Header Showcase
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Compare All 5 Sidebar Brand Header Designs
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Click any card below (or use the <span className="font-bold text-amber-500">[1] [2] [3] [4] [5]</span> buttons in the left sidebar) to test it live on the actual sidebar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity shrink-0"
          >
            {mounted && theme === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
            Toggle {mounted && theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {([1, 2, 3, 4, 5] as const).map((v) => {
            const isSelected = selected === v;
            return (
              <div
                key={v}
                onClick={() => choose(v)}
                className={`cursor-pointer rounded-2xl p-5 transition-all spatial-glass flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {BRAND_VARIANT_LABELS[v]}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={13} /> Active on Sidebar
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Click to preview</span>
                    )}
                  </div>

                  {/* Mock Sidebar Top Frame */}
                  <div className="w-64 mx-auto rounded-xl p-4 bg-slate-100/90 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 shadow-inner mb-4">
                    <SidebarBrandHeader variant={v} role="Manager" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {VARIANT_DESCRIPTIONS[v]}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    choose(v);
                  }}
                  className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-500'
                  }`}
                >
                  {isSelected ? `Currently Previewing Option #${v}` : `Apply Option #${v} to Sidebar`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
