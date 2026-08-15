'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ChildProfile,
  PROFILE_STORAGE_KEY,
  generateChildId,
  getSelectedChild,
  loadChildrenFromStorage,
  migrateLegacyProfile,
  saveChildrenToStorage,
} from '@/lib/children';
import { createClient } from '@/lib/supabase/client';

type ChildContextType = {
  motherName: string;
  postpartumDate: string;
  feedingMethod: string;
  dietaryRestrictions: string;
  motherComplications: string;
  children: ChildProfile[];
  selectedChildId: string;
  selectedChild: ChildProfile | null;
  selectChild: (id: string) => void;
  addChild: (child: Omit<ChildProfile, 'id'>) => Promise<ChildProfile>;
  updateChild: (id: string, updates: Partial<ChildProfile>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  updateMotherProfile: (updates: {
    motherName?: string;
    postpartumDate?: string;
    feedingMethod?: string;
    dietaryRestrictions?: string;
    motherComplications?: string;
  }) => Promise<void>;
  reloadProfile: () => void;
};

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export function ChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [motherName, setMotherName] = useState('Mama');
  const [postpartumDate, setPostpartumDate] = useState('2026-07-01');
  const [feedingMethod, setFeedingMethod] = useState('mixed');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [motherComplications, setMotherComplications] = useState('None');
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const loadData = useCallback(async () => {
    // 1. First load & migrate from localStorage
    const storageData = loadChildrenFromStorage();
    let currentChildren = storageData.children;
    let currentSelectedId = storageData.selectedChildId;

    try {
      const rawStr = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawStr) {
        const raw = JSON.parse(rawStr);
        const migrated = migrateLegacyProfile(raw);
        if (migrated.motherName) setMotherName(migrated.motherName);
        if (migrated.postpartumDate) setPostpartumDate(migrated.postpartumDate);
        if (migrated.feedingMethod) setFeedingMethod(migrated.feedingMethod);
        if (migrated.dietaryRestrictions) setDietaryRestrictions(migrated.dietaryRestrictions);
        if (migrated.motherComplications) setMotherComplications(migrated.motherComplications);
        currentChildren = migrated.children;
        currentSelectedId = migrated.selectedChildId;
      }
    } catch {}

    // 2. Fetch from Supabase if authenticated
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [profRes, babiesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('babies').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        ]);

        if (profRes.data) {
          const p = profRes.data;
          if (p.mother_name) setMotherName(p.mother_name);
          if (p.postpartum_date) setPostpartumDate(p.postpartum_date);
          if (p.feeding_method) setFeedingMethod(p.feeding_method);
          if (p.dietary_restrictions) setDietaryRestrictions(p.dietary_restrictions);
          if (p.mother_complications) setMotherComplications(p.mother_complications);
        }

        if (babiesRes.data && babiesRes.data.length > 0) {
          const dbChildren: ChildProfile[] = babiesRes.data.map((b: { id: string; name?: string; birth_date: string; birth_weight_kg?: number | null; complications?: string | null; created_at?: string; updated_at?: string }) => ({
            id: b.id,
            name: b.name || 'Little One',
            birthDate: b.birth_date,
            weightKg: Number(b.birth_weight_kg) || 7.5,
            complications: b.complications || 'None',
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          }));
          currentChildren = dbChildren;
          if (!currentSelectedId || !dbChildren.some((c) => c.id === currentSelectedId)) {
            currentSelectedId = dbChildren[0].id;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase profile load notice:', err);
    }

    setChildrenList(currentChildren);
    setSelectedChildId(currentSelectedId);
    saveChildrenToStorage(currentChildren, currentSelectedId);
  }, []);

  useEffect(() => {
    (async () => { await loadData(); })();
  }, [loadData]);

  const selectChild = (id: string) => {
    if (childrenList.some((c) => c.id === id)) {
      setSelectedChildId(id);
      saveChildrenToStorage(childrenList, id);
    }
  };

  const addChild = async (childInput: Omit<ChildProfile, 'id'>): Promise<ChildProfile> => {
    const newChild: ChildProfile = {
      ...childInput,
      id: generateChildId(),
      complications: childInput.complications || 'None',
      weightKg: Number(childInput.weightKg) || 7.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...childrenList, newChild];
    setChildrenList(updatedList);
    setSelectedChildId(newChild.id);
    saveChildrenToStorage(updatedList, newChild.id);

    // Save to Supabase if authenticated
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('babies')
          .insert({
            id: newChild.id,
            user_id: user.id,
            name: newChild.name,
            birth_date: newChild.birthDate,
            birth_weight_kg: newChild.weightKg,
            complications: newChild.complications,
          })
          .select()
          .single();

        if (data && data.id) {
          // Update id with DB id if generated by DB
          newChild.id = data.id;
        }
      }
    } catch (err) {
      console.warn('Supabase baby insert fallback:', err);
    }

    return newChild;
  };

  const updateChild = async (id: string, updates: Partial<ChildProfile>) => {
    const updatedList = childrenList.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    setChildrenList(updatedList);
    saveChildrenToStorage(updatedList, selectedChildId);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('babies')
          .update({
            name: updates.name,
            birth_date: updates.birthDate,
            birth_weight_kg: updates.weightKg,
            complications: updates.complications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Supabase baby update fallback:', err);
    }
  };

  const removeChild = async (id: string) => {
    if (childrenList.length <= 1) {
      throw new Error('Cannot remove the only remaining child profile.');
    }

    const updatedList = childrenList.filter((c) => c.id !== id);
    let nextSelectedId = selectedChildId;
    if (selectedChildId === id) {
      nextSelectedId = updatedList[0]?.id || '';
    }

    setChildrenList(updatedList);
    setSelectedChildId(nextSelectedId);
    saveChildrenToStorage(updatedList, nextSelectedId);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('babies').delete().eq('id', id).eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Supabase baby delete fallback:', err);
    }
  };

  const updateMotherProfile = async (updates: {
    motherName?: string;
    postpartumDate?: string;
    feedingMethod?: string;
    dietaryRestrictions?: string;
    motherComplications?: string;
  }) => {
    if (updates.motherName !== undefined) setMotherName(updates.motherName);
    if (updates.postpartumDate !== undefined) setPostpartumDate(updates.postpartumDate);
    if (updates.feedingMethod !== undefined) setFeedingMethod(updates.feedingMethod);
    if (updates.dietaryRestrictions !== undefined) setDietaryRestrictions(updates.dietaryRestrictions);
    if (updates.motherComplications !== undefined) setMotherComplications(updates.motherComplications);

    try {
      const existingStr = localStorage.getItem(PROFILE_STORAGE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : {};
      const updated = {
        ...existing,
        ...updates,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          mother_name: updates.motherName ?? motherName,
          postpartum_date: updates.postpartumDate ?? postpartumDate,
          feeding_method: updates.feedingMethod ?? feedingMethod,
          dietary_restrictions: updates.dietaryRestrictions ?? dietaryRestrictions,
          mother_complications: updates.motherComplications ?? motherComplications,
        });
      }
    } catch (err) {
      console.warn('Profile update notice:', err);
    }
  };

  const selectedChild = getSelectedChild(childrenList, selectedChildId);

  return (
    <ChildContext.Provider
      value={{
        motherName,
        postpartumDate,
        feedingMethod,
        dietaryRestrictions,
        motherComplications,
        children: childrenList,
        selectedChildId,
        selectedChild,
        selectChild,
        addChild,
        updateChild,
        removeChild,
        updateMotherProfile,
        reloadProfile: loadData,
      }}
    >
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChildren() {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChildren must be used within a ChildProvider');
  }
  return context;
}
