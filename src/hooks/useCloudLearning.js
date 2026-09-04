import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEARNING_STORAGE_KEYS,
  chooseHydratedState,
  normalizeLearningState,
  writeLocalLearningState,
} from "../lib/learningState";
import { supabase, supabaseConfigured } from "../lib/supabase";

const SAVE_DELAY_MS = 500;

function remoteState(row) {
  if (!row) return null;
  return {
    progress: row.progress,
    favorites: row.favorites,
    reviewHistory: row.review_history,
    updated_at: row.updated_at,
  };
}

async function fetchCloudState(userId) {
  const { data, error } = await supabase
    .from("user_learning_state")
    .select("progress, favorites, review_history, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return remoteState(data);
}

async function saveCloudState(userId, value) {
  const state = normalizeLearningState(value);
  const { error } = await supabase.from("user_learning_state").upsert({
    user_id: userId,
    progress: state.progress,
    favorites: state.favorites,
    review_history: state.reviewHistory,
    state_version: 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export function useCloudLearning({ progress, favorites, reviewHistory, onHydrate }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [syncStatus, setSyncStatus] = useState(supabaseConfigured ? "loading" : "unavailable");
  const [syncError, setSyncError] = useState("");
  const [syncReady, setSyncReady] = useState(false);
  const [syncRequest, setSyncRequest] = useState(0);
  const latestStateRef = useRef(normalizeLearningState({ progress, favorites, reviewHistory }));

  useEffect(() => {
    latestStateRef.current = normalizeLearningState({ progress, favorites, reviewHistory });
  }, [favorites, progress, reviewHistory]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setSyncError(error.message);
      setUser(data.session?.user || null);
      setAuthReady(true);
      setSyncStatus(data.session ? "syncing" : "signed-out");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user || null);
      setAuthReady(true);
      if (!session) {
        setSyncReady(false);
        setSyncStatus("signed-out");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const hydrate = useCallback(async (currentUser) => {
    if (!currentUser || !supabase) return;
    setSyncReady(false);
    setSyncStatus("syncing");
    setSyncError("");

    try {
      const remote = await fetchCloudState(currentUser.id);
      const localOwner = localStorage.getItem(LEARNING_STORAGE_KEYS.owner);
      const localChangedAt = Number(localStorage.getItem(LEARNING_STORAGE_KEYS.changedAt) || 0);
      const merged = chooseHydratedState({
        local: latestStateRef.current,
        remote,
        localOwner,
        userId: currentUser.id,
        localChangedAt,
      });

      latestStateRef.current = writeLocalLearningState(merged);
      onHydrate(merged);
      await saveCloudState(currentUser.id, merged);
      localStorage.setItem(LEARNING_STORAGE_KEYS.owner, currentUser.id);
      setSyncReady(true);
      setSyncStatus("synced");
    } catch (error) {
      setSyncError(error.message || "云端同步失败");
      setSyncStatus("error");
    }
  }, [onHydrate]);

  useEffect(() => {
    if (!user?.id) return;
    hydrate(user);
  }, [hydrate, syncRequest, user?.id]);

  useEffect(() => {
    if (!user?.id || !syncReady) return undefined;
    setSyncStatus("pending");
    const timer = window.setTimeout(async () => {
      try {
        await saveCloudState(user.id, latestStateRef.current);
        localStorage.setItem(LEARNING_STORAGE_KEYS.owner, user.id);
        setSyncStatus("synced");
        setSyncError("");
      } catch (error) {
        setSyncStatus("error");
        setSyncError(error.message || "云端同步失败");
      }
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [favorites, progress, reviewHistory, syncReady, user?.id]);

  async function sendMagicLink(email) {
    if (!supabase) throw new Error("Supabase 尚未配置");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return {
    configured: supabaseConfigured,
    user,
    authReady,
    syncStatus,
    syncError,
    sendMagicLink,
    signOut,
    syncNow: () => setSyncRequest((value) => value + 1),
  };
}
