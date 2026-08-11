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
  startAfter,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
  setDoc,
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
import { THREAD_LIMITS, BADGE_LIMITS } from '@/lib/types';

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
  const snap = await getDocs(collection(db, 'workerProfiles'));
  const profiles = snap.docs.map((d) => d.data() as WorkerProfile);
  return profiles.sort((a, b) => {
    if (a.isLookingForWork !== b.isLookingForWork) return a.isLookingForWork ? -1 : 1;
    return (b.averageRating ?? 0) - (a.averageRating ?? 0);
  });
}

export async function getWorkersLookingForWork(): Promise<WorkerProfile[]> {
  const snap = await getDocs(
    query(collection(db, 'workerProfiles'), where('isLookingForWork', '==', true)),
  );
  const profiles = snap.docs.map((d) => d.data() as WorkerProfile);
  return profiles.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
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
export async function createEmployerProfile(uid: string, profile: EmployerProfile) {
  // Firestore rejects fields with `undefined` values. Remove any keys
  // that are undefined so callers can pass optional fields safely.
  const sanitized: Record<string, any> = {};
  Object.entries(profile).forEach(([key, value]) => {
    if (value !== undefined) sanitized[key] = value;
  });
  await setDoc(doc(db, 'employerProfiles', uid), sanitized);
}


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

export async function updateJobPost(id: string, data: Partial<Omit<JobPost, 'id' | 'postedAt'>>) {
  await updateDoc(doc(db, 'jobPosts', id), data);
}

export async function getEmployerJobPosts(employerId: string): Promise<JobPost[]> {
  const snap = await getDocs(
    query(
      collection(db, 'jobPosts'),
      where('employerId', '==', employerId),
    ),
  );
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
  return jobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

export async function getActiveJobPosts(): Promise<JobPost[]> {
  const snap = await getDocs(
    query(
      collection(db, 'jobPosts'),
      where('status', '==', 'active'),
    ),
  );
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
  return jobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

export function subscribeToActiveJobPosts(
  onChange: (jobs: JobPost[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'jobPosts'),
      where('status', '==', 'active'),
    ),
    (snap) => {
      const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
      onChange(jobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));
    },
  );
}

/** Paginated fetch for active job posts. Returns jobs and `last` cursor (ISO postedAt) */
export async function getActiveJobPostsPage(
  pageSize = 10,
  startAfterPostedAt?: string,
): Promise<{ jobs: JobPost[]; last?: string }> {
  const clauses: any[] = [where('status', '==', 'active'), orderBy('postedAt', 'desc')];
  if (startAfterPostedAt) clauses.push(startAfter(startAfterPostedAt));
  clauses.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, 'jobPosts'), ...clauses));
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
  const last = jobs.length ? jobs[jobs.length - 1].postedAt : undefined;
  return { jobs, last };
}

/** Paginated fetch for employer job posts (by employerId). */
export async function getEmployerJobPostsPage(
  employerId: string,
  pageSize = 10,
  startAfterPostedAt?: string,
): Promise<{ jobs: JobPost[]; last?: string }> {
  const clauses: any[] = [where('employerId', '==', employerId), orderBy('postedAt', 'desc')];
  if (startAfterPostedAt) clauses.push(startAfter(startAfterPostedAt));
  clauses.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, 'jobPosts'), ...clauses));
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobPost));
  const last = jobs.length ? jobs[jobs.length - 1].postedAt : undefined;
  return { jobs, last };
}

/** Paginated worker profiles for listing pages */
export async function getWorkerProfilesPage(
  pageSize = 10,
  startAfterUpdatedAt?: string,
): Promise<{ profiles: WorkerProfile[]; last?: string }> {
  const clauses: any[] = [orderBy('updatedAt', 'desc')];
  if (startAfterUpdatedAt) clauses.push(startAfter(startAfterUpdatedAt));
  clauses.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, 'workerProfiles'), ...clauses));
  const profiles = snap.docs.map((d) => d.data() as WorkerProfile);
  const last = profiles.length ? profiles[profiles.length - 1].updatedAt : undefined;
  return { profiles, last };
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
    ),
  );
  const pings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ping));
  return pings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getWorkerPings(workerId: string): Promise<Ping[]> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('workerId', '==', workerId),
    ),
  );
  const pings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ping));
  return pings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePingStatus(id: string, status: 'accepted' | 'declined') {
  await updateDoc(doc(db, 'pings', id), { status });
}

/** Returns the existing ping if this worker already pinged this job, else null. */
export async function getWorkerPingForJob(workerId: string, jobPostId: string): Promise<Ping | null> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('workerId', '==', workerId),
      where('jobPostId', '==', jobPostId),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Ping;
}

/** Returns all pings for a specific job post. */
export async function getJobPings(jobPostId: string): Promise<Ping[]> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('jobPostId', '==', jobPostId),
    ),
  );
  const pings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ping));
  return pings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Convenience: count of pings for a job post */
export async function getJobPingCount(jobPostId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, 'pings'),
      where('jobPostId', '==', jobPostId),
    ),
  );
  return snap.size;
}

/** Log a view for a job post. Minimal doc: jobId, workerId (optional), viewedAt */
export async function logJobView(jobId: string, workerId?: string): Promise<void> {
  try {
    await addDoc(collection(db, 'jobViews'), {
      jobId,
      workerId: workerId || null,
      viewedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('logJobView error', e);
  }
}

/** Returns number of views recorded for a job post */
export async function getJobViewCount(jobId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, 'jobViews'),
      where('jobId', '==', jobId),
    ),
  );
  return snap.size;
}

/** Returns number of conversations tied to a job post */
export async function getJobConversationCount(jobId: string): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('jobPostId', '==', jobId),
    ),
  );
  return snap.size;
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
  // Only users with employer role may start new conversations.
  if (employer.role !== 'employer') {
    throw new Error('Only employers may start new conversations.');
  }
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
  
  // Validate required fields
  if (!employer.displayName) throw new Error('Employer name is missing');
  if (!workerName) throw new Error('Worker name is missing');
  
  const conv: Omit<Conversation, 'id'> = {
    employerId: employer.uid,
    employerName: employer.displayName,
    workerId,
    workerName,
    lastMessage: '',
    lastMessageAt: now,
    createdAt: now,
    ...(jobPostId && { jobPostId }),
    ...(jobTitle && { jobTitle }),
  };

  const ref = await addDoc(collection(db, 'conversations'), conv);

  // Increment thread counter
  await updateDoc(doc(db, 'users', employer.uid), {
    monthlyThreadsStarted: increment(1),
  });

  return ref.id;
}

/**
 * Returns the existing conversation ID between employer and worker, or null.
 * Used to avoid creating duplicate threads.
 */
export async function findExistingConversation(
  employerId: string,
  workerId: string,
): Promise<string | null> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('employerId', '==', employerId),
      where('workerId', '==', workerId),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * Gets or creates a conversation. If one already exists, returns its ID without
 * consuming a monthly thread slot.
 */
export async function getOrCreateConversation(
  employer: UserDoc,
  workerId: string,
  workerName: string,
  jobPostId?: string,
  jobTitle?: string,
): Promise<{ conversationId: string; isNew: boolean }> {
  const existing = await findExistingConversation(employer.uid, workerId);
  if (existing) return { conversationId: existing, isNew: false };
  const conversationId = await startConversation(employer, workerId, workerName, jobPostId, jobTitle);
  return { conversationId, isNew: true };
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
    query(collection(db, 'conversations'), where(field, '==', uid)),
  );
  const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
  return convs.sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime());
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
    lastMessageSenderId: message.senderId,
    lastMessageSeen: false,
  });

  // Mark all unread messages sent by the other party as seen
  try {
    const unreadQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('senderId', '!=', message.senderId)
    );
    const snap = await getDocs(unreadQuery);
    const batch = writeBatch(db);
    let hasUpdates = false;
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.seenAt) {
        batch.update(docSnap.ref, { seenAt: now });
        hasUpdates = true;
      }
    });
    if (hasUpdates) {
      await batch.commit();
    }
  } catch (e) {
    console.error('Error marking messages as seen in sendMessage:', e);
  }
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

/** Real-time listener — calls onMessages each time messages change */
export function subscribeToMessages(
  conversationId: string,
  onMessages: (messages: Message[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    ),
    (snap) => {
      onMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    },
  );
}

/** Real-time listener for conversations for a given user (employer or worker) */
export function subscribeToConversations(
  uid: string,
  role: 'employer' | 'worker',
  onConversations: (convs: Conversation[]) => void,
): Unsubscribe {
  const field = role === 'employer' ? 'employerId' : 'workerId';
  return onSnapshot(
    query(collection(db, 'conversations'), where(field, '==', uid)),
    (snap) => {
      const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
      onConversations(convs.sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()));
    },
  );
}

/** Mark a specific message as seen (sets seenAt timestamp) */
export async function markMessageSeen(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await updateDoc(
    doc(db, 'conversations', conversationId, 'messages', messageId),
    { seenAt: new Date().toISOString() },
  );
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessageSeen: true,
  });
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

/** Add a one-off message under a contract (e.g., employee's rejection note) */
export async function addContractMessage(
  contractId: string,
  fromUid: string,
  text: string,
) {
  await addDoc(collection(db, 'contracts', contractId, 'messages'), {
    fromUid,
    text,
    createdAt: new Date().toISOString(),
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
    query(collection(db, 'contracts'), where(field, '==', uid)),
  );
  const contracts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contract));
  return contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  // Get reviewer's subscription tier to enforce limits
  const fromUser = await getUserDoc(review.fromUid);
  const tier = fromUser?.subscriptionTier ?? 'free';
  const limit = BADGE_LIMITS[tier] ?? 1;

  // Determine the number of badges being awarded
  const badgesAwarded = review.badges && review.badges.length > 0
    ? review.badges
    : (review.badge ? [review.badge] : []);

  if (badgesAwarded.length > limit) {
    throw new Error(`Your subscription tier (${tier}) only allows up to ${limit} badge(s) per review.`);
  }

  // Also enforce the explicit guard: if reviewer allows only 1, badge must be capped at 1
  if (limit === 1 && badgesAwarded.length > 1) {
    throw new Error('Your plan only allows awarding 1 badge per review.');
  }

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

    // Loop through all awarded badges and increment on UserDoc
    badgesAwarded.forEach((b) => {
      batch.update(toRef, {
        [`badgeCounts.${b}`]: increment(1),
      });
    });
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
    
    // Loop through all awarded badges and increment on ProfileDoc
    badgesAwarded.forEach((b) => {
      batch.update(profileRef, {
        [`badgeCounts.${b}`]: increment(1),
      });
    });
  }

  await batch.commit();
}

/** Returns how many badges a user has already awarded in reviews for a given contract */
export async function getBadgesGivenInContract(
  fromUid: string,
  contractId: string,
): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('fromUid', '==', fromUid),
      where('contractId', '==', contractId),
    ),
  );
  let count = 0;
  snap.docs.forEach((d) => {
    const data = d.data() as Review;
    if (data.badges && data.badges.length > 0) {
      count += data.badges.length;
    } else if (data.badge != null) {
      count += 1;
    }
  });
  return count;
}

export async function getReviewsForUser(toUid: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('toUid', '==', toUid)),
  );
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
