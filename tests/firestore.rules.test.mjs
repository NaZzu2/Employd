import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
let testEnv;

const user = (uid, role) => ({
  uid,
  email: `${uid}@example.test`,
  displayName: uid,
  role,
  subscriptionTier: 'free',
  searchRadiusKm: 50,
  badgeCounts: {
    punctual: 0,
    reliable: 0,
    quality: 0,
    professional: 0,
    goes_above: 0,
  },
  averageRating: 0,
  reviewCount: 0,
  monthlyThreadsStarted: 0,
  monthlyThreadsResetAt: '2026-09-30T00:00:00.000Z',
  createdAt: '2026-09-30T00:00:00.000Z',
});

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/employer'), user('employer', 'employer'));
    await setDoc(doc(db, 'users/worker'), user('worker', 'worker'));
    await setDoc(doc(db, 'workerProfiles/worker'), {
      uid: 'worker',
      displayName: 'Worker',
      title: 'Worker',
      summary: '',
      skills: [],
      isLookingForWork: true,
      experience: [],
      education: [],
      badgeCounts: user('worker', 'worker').badgeCounts,
      averageRating: 0,
      reviewCount: 0,
      updatedAt: '2026-09-30T00:00:00.000Z',
    });
    await setDoc(doc(db, 'jobPosts/job1'), {
      employerId: 'employer',
      employerName: 'Employer',
      companyName: 'Employer Inc',
      title: 'Worker Role',
      location: { lat: 1, lng: 1, address: 'City' },
      type: 'Full-time',
      salary: 'Negotiable',
      description: 'Work description',
      requirements: ['Experience'],
      status: 'active',
      postedAt: '2026-09-30T00:00:00.000Z',
    });
    await setDoc(doc(db, 'jobPosts/closed1'), {
      employerId: 'employer',
      employerName: 'Employer',
      companyName: 'Employer Inc',
      title: 'Closed Role',
      location: { lat: 1, lng: 1, address: 'City' },
      type: 'Full-time',
      salary: 'Negotiable',
      description: 'Closed role',
      requirements: [],
      status: 'closed',
      postedAt: '2026-09-30T00:00:00.000Z',
    });
    await setDoc(doc(db, 'contracts/contract1'), {
      employerId: 'employer',
      employerName: 'Employer',
      workerId: 'worker',
      workerName: 'Worker',
      jobPostId: '',
      jobTitle: '',
      status: 'active',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
    await setDoc(doc(db, 'contracts/pending1'), {
      employerId: 'employer',
      employerName: 'Employer',
      workerId: 'worker',
      workerName: 'Worker',
      jobPostId: '',
      jobTitle: '',
      status: 'pending_worker_acceptance',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-employd',
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed();
});

after(async () => {
  await testEnv.cleanup();
});

test('users cannot change their assigned role', async () => {
  const db = testEnv.authenticatedContext('worker').firestore();
  await assertFails(updateDoc(doc(db, 'users/worker'), { role: 'employer' }));
});

test('users cannot read another account document containing private account fields', async () => {
  const db = testEnv.authenticatedContext('worker').firestore();
  await assertFails(getDoc(doc(db, 'users/employer')));
});

test('a reviewer can create one review per contract and cannot overwrite it', async () => {
  const db = testEnv.authenticatedContext('worker').firestore();
  const review = {
    fromUid: 'worker',
    fromName: 'Worker',
    fromRole: 'worker',
    toUid: 'employer',
    stars: 5,
    contractId: 'contract1',
    createdAt: '2026-09-30T00:00:00.000Z',
  };
  const reviewRef = doc(db, 'reviews/contract1_worker');

  await assertSucceeds(setDoc(reviewRef, review));
  await assertFails(setDoc(reviewRef, { ...review, stars: 1 }));
});

test('only the worker can accept a pending contract', async () => {
  const workerDb = testEnv.authenticatedContext('worker').firestore();
  const employerDb = testEnv.authenticatedContext('employer').firestore();

  await assertSucceeds(updateDoc(doc(workerDb, 'contracts/pending1'), {
    status: 'active',
    workerRespondedAt: '2026-09-30T00:00:00.000Z',
  }));
  await assertFails(updateDoc(doc(employerDb, 'contracts/pending1'), {
    status: 'active',
    workerRespondedAt: '2026-09-30T00:00:00.000Z',
  }));
});

test('only the employer can complete an active contract', async () => {
  const workerDb = testEnv.authenticatedContext('worker').firestore();
  const employerDb = testEnv.authenticatedContext('employer').firestore();
  const completedAt = '2026-09-30T00:00:00.000Z';

  await assertSucceeds(updateDoc(doc(employerDb, 'contracts/contract1'), {
    status: 'completed',
    completedAt,
  }));
  await assertFails(updateDoc(doc(workerDb, 'contracts/contract1'), {
    status: 'completed',
    completedAt,
  }));
});

test('only an employer can create a conversation with a worker', async () => {
  const employerDb = testEnv.authenticatedContext('employer').firestore();
  const workerDb = testEnv.authenticatedContext('worker').firestore();
  const conversation = {
    employerId: 'employer',
    employerName: 'Employer',
    workerId: 'worker',
    workerName: 'Worker',
    lastMessage: '',
    lastMessageAt: '2026-09-30T00:00:00.000Z',
    createdAt: '2026-09-30T00:00:00.000Z',
  };

  await assertSucceeds(addDoc(collection(employerDb, 'conversations'), conversation));
  await assertFails(addDoc(collection(workerDb, 'conversations'), conversation));
});

test('workers can ping active jobs owned by the named employer', async () => {
  const db = testEnv.authenticatedContext('worker').firestore();
  const ping = {
    workerId: 'worker',
    workerName: 'Worker',
    workerTitle: '',
    jobPostId: 'job1',
    jobTitle: 'Worker Role',
    employerId: 'employer',
    message: 'I am interested in this role.',
    status: 'pending',
    createdAt: '2026-09-30T00:00:00.000Z',
  };

  await assertSucceeds(addDoc(collection(db, 'pings'), ping));
  await assertFails(addDoc(collection(db, 'pings'), { ...ping, employerId: 'worker' }));
});

test('only the worker can lock a conversation to their active contract', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'conversations/conversation1'), {
      employerId: 'employer',
      employerName: 'Employer',
      workerId: 'worker',
      workerName: 'Worker',
      lastMessage: '',
      lastMessageAt: '2026-09-30T00:00:00.000Z',
      createdAt: '2026-09-30T00:00:00.000Z',
    });
  });
  const workerDb = testEnv.authenticatedContext('worker').firestore();
  const employerDb = testEnv.authenticatedContext('employer').firestore();

  await assertSucceeds(updateDoc(doc(workerDb, 'conversations/conversation1'), {
    locked: true,
    contractId: 'contract1',
  }));
  await assertFails(updateDoc(doc(employerDb, 'conversations/conversation1'), {
    locked: true,
    contractId: 'contract1',
  }));
});

test('employers can read worker profiles without reading worker account documents', async () => {
  const employerDb = testEnv.authenticatedContext('employer').firestore();
  await assertSucceeds(getDoc(doc(employerDb, 'workerProfiles/worker')));
});

test('workers can read active jobs but not closed jobs owned by another employer', async () => {
  const workerDb = testEnv.authenticatedContext('worker').firestore();
  const employerDb = testEnv.authenticatedContext('employer').firestore();
  await assertSucceeds(getDoc(doc(workerDb, 'jobPosts/job1')));
  await assertFails(getDoc(doc(workerDb, 'jobPosts/closed1')));
  await assertSucceeds(getDoc(doc(employerDb, 'jobPosts/closed1')));
});