'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserDoc, UserRole, SubscriptionTier } from '@/lib/types';
import { EMPTY_BADGE_COUNTS } from '@/lib/badge-config';

// ─── Context types ────────────────────────────────────────────────────────────

type AuthState = {
  firebaseUser: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserRole>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  signIn: async () => 'worker',
  signUp: async () => {},
  signOut: async () => {},
  refreshUserDoc: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDoc = useCallback(async (uid: string): Promise<UserDoc | null> => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserDoc;
    }
    return null;
  }, []);

  const refreshUserDoc = useCallback(async () => {
    if (firebaseUser) {
      const d = await fetchUserDoc(firebaseUser.uid);
      setUserDoc(d);
    }
  }, [firebaseUser, fetchUserDoc]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const d = await fetchUserDoc(user.uid);
        setUserDoc(d);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserDoc]);

  // ── Sign In ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<UserRole> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const d = await fetchUserDoc(credential.user.uid);
    setUserDoc(d);
    return d?.role ?? 'worker';
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<void> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const now = new Date().toISOString();
    const newUser: UserDoc = {
      uid: credential.user.uid,
      email,
      displayName,
      role,
      subscriptionTier: 'free' as SubscriptionTier,
      searchRadiusKm: 50,
      badgeCounts: EMPTY_BADGE_COUNTS,
      averageRating: 0,
      reviewCount: 0,
      monthlyThreadsStarted: 0,
      monthlyThreadsResetAt: now,
      createdAt: now,
    };

    // Create user document
    await setDoc(doc(db, 'users', credential.user.uid), newUser);

    // Create role-specific profile skeleton
    if (role === 'worker') {
      await setDoc(doc(db, 'workerProfiles', credential.user.uid), {
        uid: credential.user.uid,
        displayName,
        title: '',
        summary: '',
        skills: [],
        isLookingForWork: true,
        experience: [],
        education: [],
        badgeCounts: EMPTY_BADGE_COUNTS,
        averageRating: 0,
        reviewCount: 0,
        updatedAt: now,
      });
    } else {
      await setDoc(doc(db, 'employerProfiles', credential.user.uid), {
        uid: credential.user.uid,
        displayName,
        companyName: '',
        industry: '',
        description: '',
        badgeCounts: EMPTY_BADGE_COUNTS,
        averageRating: 0,
        reviewCount: 0,
        updatedAt: now,
      });
    }

    setUserDoc(newUser);
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUserDoc(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userDoc, loading, signIn, signUp, signOut, refreshUserDoc }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
