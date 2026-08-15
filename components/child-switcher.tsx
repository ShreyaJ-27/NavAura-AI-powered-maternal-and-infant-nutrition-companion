'use client';

import React, { useState } from 'react';
import { Baby, Plus, Sparkles, X } from 'lucide-react';
import { useChildren } from './child-context';
import { calculateBabyAge } from '@/lib/age';

type ChildSwitcherProps = {
  compact?: boolean;
  showAddModalButton?: boolean;
  className?: string;
};

export function ChildSwitcher({
  compact = false,
  showAddModalButton = true,
  className = '',
}: ChildSwitcherProps) {
  const { children, selectedChildId, selectChild, addChild } = useChildren();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('2026-02-01');
  const [weightKg, setWeightKg] = useState('7.0');
  const [complications, setComplications] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for the child.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await addChild({
        name: name.trim(),
        birthDate,
        weightKg: Number(weightKg) || 7.0,
        complications: complications.trim() || 'None',
      });
      setName('');
      setComplications('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add child.');
    } finally {
      setIsSaving(false);
    }
  }

  if (children.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4 text-[#C9969A]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#827779]">
              Your Little Ones ({children.length})
            </span>
          </div>
          {children.length > 1 && (
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              Multi-Child Mode Active
            </span>
          )}
        </div>
      )}

      {/* Horizontal Pill Row */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
        {children.map((child) => {
          const isSelected = child.id === selectedChildId;
          const age = calculateBabyAge(new Date(child.birthDate));

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => selectChild(child.id)}
              className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold transition duration-200 shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#F3DCE1] via-[#EBC5D7] to-[#F2D0C1] text-[#292628] shadow-[0_4px_20px_rgba(201,150,154,0.35)] border-2 border-white/95 scale-102'
                  : 'bg-white/70 text-[#4E4445] hover:bg-white border border-white/90 shadow-xs'
              }`}
              aria-pressed={isSelected}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition ${
                  isSelected ? 'bg-white text-[#C9969A] shadow-xs font-black' : 'bg-[#F3DCE1]/60 text-[#827779]'
                }`}
              >
                👶
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-sm">{child.name}</span>
                <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#4E4445]' : 'text-[#827779]'}`}>
                  • {age.formatted} ({age.months}m)
                </span>
              </div>
              {child.complications && child.complications !== 'None' && child.complications !== 'none' && (
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-xs" title={`Note: ${child.complications}`} />
              )}
            </button>
          );
        })}

        {showAddModalButton && children.length < 5 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-[#C9969A]/70 bg-white/50 px-3.5 py-2 text-xs font-bold text-[#C9969A] hover:bg-[#F3DCE1]/50 transition shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Child</span>
          </button>
        )}
      </div>

      {/* Add Child Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[34px] glass-panel p-6 border border-white/95 bg-white/95 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A]">
                  <Baby className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#C9969A]">Infant Profile</p>
                  <h3 className="text-lg font-bold text-[#292628] font-serif">Add Another Child</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mira, Leo, Sam..."
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-[#292628] focus:outline-none focus:border-[#C9969A] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-[#292628] focus:outline-none focus:border-[#C9969A] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="7.0"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-[#292628] focus:outline-none focus:border-[#C9969A] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">
                    Complications
                  </label>
                  <input
                    type="text"
                    value={complications}
                    onChange={(e) => setComplications(e.target.value)}
                    placeholder="e.g. GERD, CMPA, Preterm..."
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-[#292628] focus:outline-none focus:border-[#C9969A] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 rounded-full border border-stone-200 py-2.5 text-xs font-bold text-[#4E4445] hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-2/3 flex items-center justify-center gap-2 rounded-full bg-[#292628] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#4E4445] transition disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#EBC5D7]" />
                  {isSaving ? 'Adding Child...' : 'Save & Select Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
