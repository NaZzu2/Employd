const { config } = require('dotenv');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

config({ path: '.env.local' });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Missing Firebase service account path. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS in .env.local.');
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

if (!admin.getApps().length) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
}

const db = getFirestore();

const employer = {
  uid: 'fi-employer-1',
  email: 'finnish-employer@example.com',
  displayName: 'Suomalainen Rakentajat Oy',
  role: 'employer',
  subscriptionTier: 'pro',
  searchRadiusKm: 50,
  badgeCounts: { punctual: 0, reliable: 0, quality: 0, professional: 0, goes_above: 0 },
  averageRating: 4.3,
  reviewCount: 12,
  monthlyThreadsStarted: 0,
  monthlyThreadsResetAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const employerProfile = {
  uid: 'fi-employer-1',
  displayName: 'Suomalainen Rakentajat Oy',
  companyName: 'Suomalainen Rakentajat Oy',
  industry: 'Rakentaminen',
  location: { lat: 60.1699, lng: 24.9384, address: 'Helsinki, Suomi' },
  description: 'Pieni rakennusyritys, joka etsii luotettavia alihankkijoita ja työntekijöitä.',
  website: 'https://rakennus.fi',
  averageRating: 4.3,
  reviewCount: 12,
  badgeCounts: { punctual: 5, reliable: 6, quality: 3, professional: 2, goes_above: 1 },
  updatedAt: new Date().toISOString(),
};

const jobs = [
  {
    id: 'fi-job-1',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Kirvesmies palkataan remonttitöihin',
    location: { lat: 60.1699, lng: 24.9384, address: 'Helsinki, Suomi' },
    type: 'Contract',
    salary: '€25-35/hour',
    description: 'Seeking a skilled carpenter for residential renovation projects across Helsinki. Experience in carpentry, finish work and drywall installation is preferred.',
    requirements: ['Carpentry', 'Finish work', 'Drywall installation'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'fi-job-2',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Sähköasentaja tarvitaan uudiskohteeseen',
    location: { lat: 60.2055, lng: 24.6559, address: 'Espoo, Suomi' },
    type: 'Full-time',
    salary: '€28-38/hour',
    description: 'Electrical wiring and installation work for a new construction project. Must comply with commercial safety standards and building codes.',
    requirements: ['Electrical wiring', 'Commercial standards', 'Safety'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'fi-job-3',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Putkiasentaja urakkahommiin',
    location: { lat: 60.2934, lng: 25.0378, address: 'Vantaa, Suomi' },
    type: 'Contract',
    salary: '€24-32/hour',
    description: 'Plumbing installation and repair work for residential builds and renovations. Experience with pipe installation and troubleshooting required.',
    requirements: ['Plumbing', 'Pipe installation', 'Troubleshooting'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'fi-job-4',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Autonasentaja auto- ja kuorma-autoille',
    location: { lat: 60.1699, lng: 24.9384, address: 'Helsinki, Suomi' },
    type: 'Full-time',
    salary: '€26-36/hour',
    description: 'General maintenance and repair of cars and commercial vehicles. Diagnostics, engine repair, and welding experience is a plus.',
    requirements: ['Engine repair', 'Diagnostics', 'Welding'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'fi-job-5',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Rengashuollon ammattilainen',
    location: { lat: 60.4518, lng: 22.2666, address: 'Turku, Suomi' },
    type: 'Part-time',
    salary: '€22-28/hour',
    description: 'Tire changes, wheel alignment and suspension work for passenger vehicles. Reliable and safety-minded candidates preferred.',
    requirements: ['Tire maintenance', 'Wheel alignment', 'Suspension'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'fi-job-6',
    employerId: 'fi-employer-1',
    employerName: 'Suomalainen Rakentajat Oy',
    companyName: 'Suomalainen Rakentajat Oy',
    title: 'Autojen korjaaja erikoistuneesti sähkö- ja hybridivoiman',
    location: { lat: 61.4978, lng: 23.7610, address: 'Tampere, Suomi' },
    type: 'Contract',
    salary: '€30-40/hour',
    description: 'Maintenance and repair of electric and hybrid vehicles. Requires knowledge of EV systems, battery diagnostics, and high voltage safety.',
    requirements: ['EV systems', 'Battery diagnostics', 'High voltage safety'],
    status: 'active',
    postedAt: new Date().toISOString(),
  },
];

async function seed() {
  try {
    await db.collection('users').doc(employer.uid).set(employer);
    await db.collection('employerProfiles').doc(employer.uid).set(employerProfile);
    console.log('Created employer user and profile.');

    for (const job of jobs) {
      await db.collection('jobPosts').doc(job.id).set(job);
      console.log(`Seeded job ${job.id} - ${job.title}`);
    }

    console.log('Finnish job listings seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
