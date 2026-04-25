// ─── Roles & Subscriptions ───────────────────────────────────────────────────

export type UserRole = 'employer' | 'worker';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type BadgeType = 'punctual' | 'reliable' | 'quality' | 'professional' | 'goes_above';

// Thread limits per subscription tier (employer-only)
export const THREAD_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 50,
  enterprise: Infinity,
};

// ─── Geolocation ─────────────────────────────────────────────────────────────

export type GeoLocation = {
  lat: number;
  lng: number;
  address: string; // Human-readable
};

// ─── User (Firestore: users/{uid}) ───────────────────────────────────────────

export type UserDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  location?: GeoLocation;
  searchRadiusKm: number; // default 50
  badgeCounts: Record<BadgeType, number>;
  averageRating: number;
  reviewCount: number;
  // Employer-only: conversation throttle
  monthlyThreadsStarted: number;
  monthlyThreadsResetAt: string; // ISO date
  createdAt: string;
};

// ─── Worker Profile (Firestore: workerProfiles/{uid}) ────────────────────────

export type WorkerProfile = {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  title: string;
  location?: GeoLocation;
  summary: string;
  skills: string[];
  isLookingForWork: boolean;
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  averageRating: number;
  reviewCount: number;
  badgeCounts: Record<BadgeType, number>;
  updatedAt: string;
};

// ─── Employer Profile (Firestore: employerProfiles/{uid}) ────────────────────

export type EmployerProfile = {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  companyName: string;
  industry: string;
  location?: GeoLocation;
  description: string;
  website?: string;
  averageRating: number;
  reviewCount: number;
  badgeCounts: Record<BadgeType, number>;
  updatedAt: string;
};

// ─── Job Post (Firestore: jobPosts/{id}) ─────────────────────────────────────

export type JobType = 'Full-time' | 'Part-time' | 'Contract';
export type JobStatus = 'active' | 'closed';

export type JobPost = {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  title: string;
  location: GeoLocation;
  type: JobType;
  salary: string;
  description: string;
  requirements: string[];
  status: JobStatus;
  imageUrl?: string;
  postedAt: string;
};

// ─── Conversation (Firestore: conversations/{id}) ────────────────────────────

export type Conversation = {
  id: string;
  employerId: string;
  employerName: string;
  workerId: string;
  workerName: string;
  jobPostId?: string;
  jobTitle?: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

// ─── Message (Firestore: conversations/{id}/messages/{msgId}) ────────────────

export type Message = {
  id: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  createdAt: string;
};

// ─── Ping (Firestore: pings/{id}) ────────────────────────────────────────────

export type PingStatus = 'pending' | 'accepted' | 'declined';

export type Ping = {
  id: string;
  workerId: string;
  workerName: string;
  workerTitle: string;
  workerAvatarUrl?: string;
  jobPostId: string;
  jobTitle: string;
  employerId: string;
  message: string;
  status: PingStatus;
  createdAt: string;
};

// ─── Contract (Firestore: contracts/{id}) ────────────────────────────────────

export type ContractStatus =
  | 'pending_worker_acceptance'
  | 'active'
  | 'completed'
  | 'declined';

export type Contract = {
  id: string;
  employerId: string;
  employerName: string;
  workerId: string;
  workerName: string;
  jobPostId: string;
  jobTitle: string;
  status: ContractStatus;
  createdAt: string;
  workerRespondedAt?: string;
  completedAt?: string;
};

// ─── Review (Firestore: reviews/{id}) ────────────────────────────────────────

export type StarRating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: string;
  fromUid: string;
  fromName: string;
  fromRole: UserRole;
  toUid: string;
  stars: StarRating;
  badge?: BadgeType; // optional
  comment?: string;
  contractId: string;
  createdAt: string;
};

// ─── Legacy types (kept for compatibility with existing mock data) ────────────

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  salary: string;
  description: string;
  requirements: string[];
  postedAt: string;
  imageUrl: string;
  imageHint: string;
};

export type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  title: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
};
