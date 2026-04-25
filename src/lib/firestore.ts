import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  WorkerProfile,
  EmployerProfile,
  JobPost,
  Conversation,
  Message,
  Ping,
  Contract,
  Review,
  BadgeType,
  StarRating,
  UserDoc,
} from '@/lib/types';
import { shouldResetMonthlyThreads, canStartThread } from '@/lib/utils';
import { THREAD_LIMITS } from '@/lib/types';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function updateUserLocation(
  uid: string,
  location: { lat: number; lng: number; address: string },
) {
  await updateDoc(doc(db, 'users', uid), { location });
}

export async function updateSearchRadius(uid: string, radiusKm: number) {
  await updateDoc(doc(db, 'users', uid), { searchRadiusKm: radiusKm });
}

// ─── Worker Profiles ──────────────────────────────────────────────────────────

export async function getWorkerProfile(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(doc(db, 'workerProfiles', uid));
  return snap.exists() ? (snap.data() as WorkerProfile) : null;
}

export async function getAllWorkerProfiles(): Promise<WorkerProfile[]> {
  const snap = await getDocs(
    query(
      collection(db, 'workerProfiles'),
      orderBy('isLookingForWork', 'desc'),
      orderBy('averageRating', 'desc'),
    ),
  );
  return snap.docs.map((d) => d.data() as WorkerProfile);
}

export async function updateWorkerProfile(
  uid: string,
  data: Partial<WorkerProfile>,
) {
  await updateDoc(doc(db, 'workerProfiles', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleLookingForWork(uid: string, value: boolean) {
  await updateDoc(doc(db, 'workerProfiles', uid), { isLookingForWork: value });
}

// ─── Employer Profiles ───────────────────────────────────────────────────────

export async function getEmployerProfile(uid: string): Promise<EmployerProfile | null> {
  const snap = await getDoc(doc(db, 'employerProfiles', uid));
  return snap.exists() ? (snap.data() as EmployerProfile) : null;
}

export async function updateEmployerProfile(
  uid: string,
  data: Partial<EmployerProfile>,
) {
  await updateDoc(doc(db, 'employerProfiles', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Job Posts ────────────────────────────────────────────────────────────────

export async function createJobPost(
  data: Omit<JobPost, 'id' | 'postedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'jobPosts'), {
    ...data,
    postedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getJobPost(id: string): Promise<JobPost | null> {
  const snap = await getDoc(doc(db, 'jobPosts', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as JobPost) : null;
}

export async function getEmployerJobPosts(employerId: string): Promise<JobPost[]> {
  const snap = await getDocs(
    query(
      collection(db, 'jobPosts'),
      where('employerId', '==', employerId),
      orderBy('postedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
}

export async function getActiveJobPosts(): Promise<JobPost[]> {
  const snap = await getDocs(
    query(
      collection(db, 'jobPosts'),
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
}

export async function updateJobPostStatus(id: string, status: 'active' | 'closed') {
  await updateDoc(doc(db, 'jobPosts', id), { status });
}

// ─── Pings ────────────────────────────────────────────────────────────────────

export async function sendPing(
  data: Omit<Ping, 'id' | 'createdAt' | 'status'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'pings'), {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getEmployerPings(employerId: string): Promise<Ping[]> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('employerId', '==', employerId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ping));
}

export async function getWorkerPings(workerId: string): Promise<Ping[]> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('workerId', '==', workerId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ping));
}

export async function updatePingStatus(id: string, status: 'accepted' | 'declined') {
  await updateDoc(doc(db, 'pings', id), { status });
}

// ─── Conversations ────────────────────────────────────────────────────────────

/** Employer starts a conversation. Checks thread limits and resets monthly counter if needed. */
export async function startConversation(
  employer: UserDoc,
  workerId: string,
  workerName: string,
  jobPostId?: string,
  jobTitle?: string,
): Promise<string> {
  // Reset monthly counter if needed
  let threadsUsed = employer.monthlyThreadsStarted;
  const resetUpdates: { monthlyThreadsStarted: number; monthlyThreadsResetAt: string } = {
    monthlyThreadsStarted: 0,
    monthlyThreadsResetAt: '',
  };
  if (shouldResetMonthlyThreads(employer.monthlyThreadsResetAt)) {
    threadsUsed = 0;
    resetUpdates.monthlyThreadsStarted = 0;
    resetUpdates.monthlyThreadsResetAt = new Date().toISOString();
    await updateDoc(doc(db, 'users', employer.uid), resetUpdates);
  }

  if (!canStartThread(employer.subscriptionTier, threadsUsed)) {
    const limit = THREAD_LIMITS[employer.subscriptionTier];
    throw new Error(
      `Monthly conversation limit reached (${limit}). Upgrade your plan to start more conversations.`,
    );
  }

  const now = new Date().toISOString();
  const conv: Omit<Conversation, 'id'> = {
    employerId: employer.uid,
    employerName: employer.displayName,
    workerId,
    workerName,
    jobPostId,
    jobTitle,
    lastMessage: '',
    lastMessageAt: now,
    createdAt: now,
  };

  const ref = await addDoc(collection(db, 'conversations'), conv);

  // Increment thread counter
  await updateDoc(doc(db, 'users', employer.uid), {
    monthlyThreadsStarted: increment(1),
  });

  return ref.id;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, 'conversations', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}

export async function getUserConversations(
  uid: string,
  role: 'employer' | 'worker',
): Promise<Conversation[]> {
  const field = role === 'employer' ? 'employerId' : 'workerId';
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where(field, '==', uid),
      orderBy('lastMessageAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  message: Omit<Message, 'id' | 'createdAt'>,
): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    ...message,
    createdAt: now,
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: message.text,
    lastMessageAt: now,
  });
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
}

// ─── Contracts ────────────────────────────────────────────────────────────────

/** Employer marks a worker as hired — creates pending contract */
export async function createContract(
  data: Omit<Contract, 'id' | 'createdAt' | 'status'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'contracts'), {
    ...data,
    status: 'pending_worker_acceptance',
    createdAt: new Date().toISOString(),
  });

  // Send system message to existing conversation or note (handled by caller)
  return ref.id;
}

export async function workerRespondToContract(
  contractId: string,
  accept: boolean,
) {
  const status = accept ? 'active' : 'declined';
  await updateDoc(doc(db, 'contracts', contractId), {
    status,
    workerRespondedAt: new Date().toISOString(),
  });
}

export async function markContractComplete(contractId: string) {
  await updateDoc(doc(db, 'contracts', contractId), {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export async function getUserContracts(
  uid: string,
  role: 'employer' | 'worker',
): Promise<Contract[]> {
  const field = role === 'employer' ? 'employerId' : 'workerId';
  const snap = await getDocs(
    query(
      collection(db, 'contracts'),
      where(field, '==', uid),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contract));
}

export async function getPendingContractsForWorker(workerId: string): Promise<Contract[]> {
  const snap = await getDocs(
    query(
      collection(db, 'contracts'),
      where('workerId', '==', workerId),
      where('status', '==', 'pending_worker_acceptance'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contract));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function hasReviewedContract(
  fromUid: string,
  contractId: string,
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('fromUid', '==', fromUid),
      where('contractId', '==', contractId),
    ),
  );
  return !snap.empty;
}

export async function submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
  const batch = writeBatch(db);

  // Add review document
  const reviewRef = doc(collection(db, 'reviews'));
  batch.set(reviewRef, { ...review, createdAt: new Date().toISOString() });

  // Update recipient's stats on their user doc
  const toRef = doc(db, 'users', review.toUid);
  const toSnap = await getDoc(toRef);
  if (toSnap.exists()) {
    const toData = toSnap.data() as { averageRating: number; reviewCount: number };
    const newCount = toData.reviewCount + 1;
    const newAvg =
      (toData.averageRating * toData.reviewCount + review.stars) / newCount;
    batch.update(toRef, { averageRating: newAvg, reviewCount: newCount });

    if (review.badge) {
      batch.update(toRef, {
        [`badgeCounts.${review.badge}`]: (toData as any)[`badgeCounts.${review.badge}`]
          ? (toData as any)[`badgeCounts.${review.badge}`] + 1
          : 1,
      });
    }
  }

  // Mirror stats on role-specific profile doc
  const profileCollection =
    review.fromRole === 'employer' ? 'workerProfiles' : 'employerProfiles';
  const profileRef = doc(db, profileCollection, review.toUid);
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) {
    const pd = profileSnap.data() as { averageRating: number; reviewCount: number };
    const newCount = pd.reviewCount + 1;
    const newAvg = (pd.averageRating * pd.reviewCount + review.stars) / newCount;
    batch.update(profileRef, { averageRating: newAvg, reviewCount: newCount });
    if (review.badge) {
      batch.update(profileRef, {
        [`badgeCounts.${review.badge}`]: increment(1),
      });
    }
  }

  await batch.commit();
}

export async function getReviewsForUser(toUid: string): Promise<Review[]> {
  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('toUid', '==', toUid),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}
