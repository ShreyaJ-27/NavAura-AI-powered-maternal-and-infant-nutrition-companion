'use client';

import { useState } from 'react';
import { Save, User, Baby, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useChildren } from '@/components/child-context';
import { calculateBabyAge } from '@/lib/age';

export default function ProfilePage() {
  const {
    motherName,
    postpartumDate,
    feedingMethod,
    dietaryRestrictions,
    motherComplications,
    children,
    updateMotherProfile,
    updateChild,
    addChild,
    removeChild,
  } = useChildren();

  // Local form state
  const [mName, setMName] = useState(motherName);
  const [pDate, setPDate] = useState(postpartumDate);
  const [fMethod, setFMethod] = useState(feedingMethod);
  const [dRestrictions, setDRestrictions] = useState(dietaryRestrictions);
  const [mComplications, setMComplications] = useState(motherComplications);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Child adding modal / inline form state
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthDate, setNewChildBirthDate] = useState(
    new Date(Date.now() - 6 * 30.4 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [newChildWeight, setNewChildWeight] = useState('7.0');
  const [newChildComplications, setNewChildComplications] = useState('');

  async function handleSaveMother(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSaved(false);

    try {
      await updateMotherProfile({
        motherName: mName,
        postpartumDate: pDate,
        feedingMethod: fMethod,
        dietaryRestrictions: dRestrictions,
        motherComplications: mComplications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mother profile.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddChildSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newChildName.trim()) return;

    try {
      await addChild({
        name: newChildName.trim(),
        birthDate: newChildBirthDate,
        weightKg: Number(newChildWeight) || 7.0,
        complications: newChildComplications.trim() || 'None',
      });
      setNewChildName('');
      setNewChildComplications('');
      setIsAddingChild(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add child.');
    }
  }

  async function handleRemoveChild(id: string, name: string) {
    if (children.length <= 1) {
      alert('Cannot remove the only remaining child profile.');
      return;
    }

    if (confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) {
      try {
        await removeChild(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove child.');
      }
    }
  }

  return (
    <AppShell title="Health Profile Settings">
      <div className="space-y-8 max-w-4xl mx-auto">
        
        {/* Mother Profile Form */}
        <form onSubmit={handleSaveMother} className="space-y-6 rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3DCE1] text-[#C9969A] shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9969A]">Maternal Data</p>
              <h3 className="text-xl font-bold text-[#292628] font-serif">Mother Profile &amp; Recovery Stage</h3>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Mother Name</label>
              <input
                type="text"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Delivery / Postpartum Date</label>
              <input
                type="date"
                value={pDate}
                onChange={(e) => setPDate(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Feeding Method</label>
              <select
                value={fMethod}
                onChange={(e) => setFMethod(e.target.value)}
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              >
                <option value="exclusive-breastfeeding">Exclusive Breastfeeding</option>
                <option value="formula">Formula Feeding</option>
                <option value="mixed">Mixed / Combination</option>
                <option value="solids">Transitioning to Solids</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Dietary Focus / Restrictions</label>
              <input
                type="text"
                value={dRestrictions}
                onChange={(e) => setDRestrictions(e.target.value)}
                placeholder="e.g. Iron focus, Plant-based, Dairy-free"
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E4445] mb-1.5">Mother Medical Complications</label>
              <input
                type="text"
                value={mComplications}
                onChange={(e) => setMComplications(e.target.value)}
                placeholder="e.g. Thyroid, Anemia, Gestational Diabetes, C-Section recovery..."
                className="w-full rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
              />
            </div>
          </div>

          {saved && (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Maternal profile updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#292628] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#4E4445] transition active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-[#EBC5D7]" />
            {isSaving ? 'Saving Changes...' : 'Save Maternal Profile Changes'}
          </button>
        </form>

        {/* Children Management Section */}
        <section className="space-y-6 rounded-[38px] glass-card p-6 md:p-8 border border-white/95 bg-white/80 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7D0AA]/40 text-amber-800 shadow-xs">
                <Baby className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">Infant Profiles</p>
                <h3 className="text-xl font-bold text-[#292628] font-serif">Registered Children ({children.length})</h3>
              </div>
            </div>

            {children.length < 5 && (
              <button
                type="button"
                onClick={() => setIsAddingChild((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-[#C9969A] bg-white/80 px-4 py-2 text-xs font-bold text-[#C9969A] hover:bg-white shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Child</span>
              </button>
            )}
          </div>

          {/* Add Child Form Inline */}
          {isAddingChild && (
            <form onSubmit={handleAddChildSubmit} className="rounded-[28px] border border-amber-200 bg-amber-50/60 p-5 space-y-4">
              <h4 className="text-sm font-bold text-[#292628] font-serif">New Child Details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Child Name</label>
                  <input
                    type="text"
                    required
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="e.g. Mira"
                    className="w-full rounded-2xl border border-white bg-white px-3.5 py-2 text-xs text-[#292628] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newChildBirthDate}
                    onChange={(e) => setNewChildBirthDate(e.target.value)}
                    className="w-full rounded-2xl border border-white bg-white px-3.5 py-2 text-xs text-[#292628] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newChildWeight}
                    onChange={(e) => setNewChildWeight(e.target.value)}
                    placeholder="7.0"
                    className="w-full rounded-2xl border border-white bg-white px-3.5 py-2 text-xs text-[#292628] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Complications</label>
                  <input
                    type="text"
                    value={newChildComplications}
                    onChange={(e) => setNewChildComplications(e.target.value)}
                    placeholder="e.g. GERD, CMPA, Preterm..."
                    className="w-full rounded-2xl border border-white bg-white px-3.5 py-2 text-xs text-[#292628] shadow-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingChild(false)}
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-[#4E4445] bg-white hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#292628] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4E4445] transition"
                >
                  Save New Child
                </button>
              </div>
            </form>
          )}

          {/* Children List */}
          <div className="space-y-4">
            {children.map((child, idx) => {
              const babyAge = calculateBabyAge(new Date(child.birthDate));
              return (
                <div
                  key={child.id}
                  className="rounded-[28px] border border-white/90 bg-white/70 p-5 space-y-3.5 shadow-xs hover:bg-white transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3DCE1] text-[#C9969A] text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-bold text-[#292628] font-serif">{child.name}</h4>
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {babyAge.formatted} ({babyAge.months}m)
                      </span>
                    </div>

                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChild(child.id, child.name)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        title={`Remove ${child.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Name</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(child.id, { name: e.target.value })}
                        className="w-full rounded-2xl border border-white bg-white/90 px-3.5 py-2 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={child.birthDate}
                        onChange={(e) => updateChild(child.id, { birthDate: e.target.value })}
                        className="w-full rounded-2xl border border-white bg-white/90 px-3.5 py-2 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={child.weightKg || ''}
                        onChange={(e) => updateChild(child.id, { weightKg: Number(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-white bg-white/90 px-3.5 py-2 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E4445] mb-1">Medical Complications / Allergies</label>
                      <input
                        type="text"
                        value={child.complications || ''}
                        onChange={(e) => updateChild(child.id, { complications: e.target.value })}
                        placeholder="e.g. GERD, Lactose sensitivity, CMPA, Premature..."
                        className="w-full rounded-2xl border border-white bg-white/90 px-3.5 py-2 text-xs text-[#292628] focus:bg-white focus:outline-none shadow-xs transition"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

