import type { Job, UserProfile } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const findImage = (id: string) => {
    const image = PlaceHolderImages.find(p => p.id === id);
    return image ?? { imageUrl: 'https://picsum.photos/seed/placeholder/600/400', imageHint: 'placeholder' };
}

export const jobs: Job[] = [
  {
    id: '1',
    title: 'Licensed Plumber',
    company: 'AquaFlow Plumbing',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$75,000 - $90,000/year',
    description: 'Seeking a licensed and experienced plumber for residential and commercial projects. Must be proficient in installations, repairs, and maintenance of plumbing systems. Strong problem-solving skills and customer service orientation are essential.',
    requirements: ['Valid plumbing license', '5+ years of experience', 'Knowledge of plumbing codes', 'Own tools'],
    postedAt: '2 days ago',
    imageUrl: findImage('job-plumber').imageUrl,
    imageHint: findImage('job-plumber').imageHint,
  },
  {
    id: '2',
    title: 'Journeyman Electrician',
    company: 'SparkSafe Electricals',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    salary: '$80,000 - $100,000/year',
    description: 'Join our team of expert electricians. Responsibilities include installing and maintaining electrical systems in new constructions and existing buildings, troubleshooting electrical issues, and ensuring all work complies with safety standards.',
    requirements: ['Journeyman electrician license', 'Experience with commercial wiring', 'Ability to read blueprints', 'Strong safety record'],
    postedAt: '5 days ago',
    imageUrl: findImage('job-electrician').imageUrl,
    imageHint: findImage('job-electrician').imageHint,
  },
  {
    id: '3',
    title: 'Finish Carpenter',
    company: 'Precision Woodworks',
    location: 'Chicago, IL',
    type: 'Contract',
    salary: '$40 - $55/hour',
    description: 'We are looking for a skilled finish carpenter to work on high-end residential projects. The ideal candidate has a keen eye for detail and expertise in installing trim, molding, cabinetry, and other fine woodwork.',
    requirements: ['Portfolio of finished projects', 'Expertise with woodworking tools', 'Meticulous attention to detail', '5+ years of carpentry experience'],
    postedAt: '1 week ago',
    imageUrl: findImage('job-carpenter').imageUrl,
    imageHint: findImage('job-carpenter').imageHint,
  },
  {
    id: '4',
    title: 'Certified Welder',
    company: 'Ironclad Structures',
    location: 'Houston, TX',
    type: 'Full-time',
    salary: '$65,000 - $80,000/year',
    description: 'Ironclad Structures is hiring a certified welder for structural steel fabrication. Must be proficient in MIG, TIG, and stick welding. Safety and quality are our top priorities.',
    requirements: ['AWS certification', 'Experience in structural steel', 'Ability to work from fabrication drawings', 'Physical stamina and dexterity'],
    postedAt: '3 days ago',
    imageUrl: findImage('job-welder').imageUrl,
    imageHint: findImage('job-welder').imageHint,
  },
    {
    id: '5',
    title: 'Automotive Mechanic',
    company: 'QuickFix Auto',
    location: 'Phoenix, AZ',
    type: 'Full-time',
    salary: '$60,000 - $75,000/year',
    description: 'Experienced automotive mechanic needed for a busy repair shop. Duties include diagnosing, repairing, and maintaining a wide variety of vehicles. ASE certification is a plus.',
    requirements: ['3+ years of professional mechanic experience', 'Strong diagnostic skills', 'Own a set of professional tools', 'ASE certification preferred'],
    postedAt: '6 days ago',
    imageUrl: findImage('job-mechanic').imageUrl,
    imageHint: findImage('job-mechanic').imageHint,
  },
  {
    id: '6',
    title: 'Commercial Painter',
    company: 'ProFinish Painters',
    location: 'Miami, FL',
    type: 'Part-time',
    salary: '$25 - $35/hour',
    description: 'Seeking a skilled commercial painter for various projects. Must have experience with interior and exterior painting, surface preparation, and using professional painting equipment.',
    requirements: ['Proven experience as a painter', 'Knowledge of painting techniques', 'Attention to detail', 'Reliable transportation'],
    postedAt: '10 days ago',
    imageUrl: findImage('job-painter').imageUrl,
    imageHint: findImage('job-painter').imageHint,
  },
];

export const userProfile: UserProfile = {
    name: 'Alex Martinez',
    email: 'alex.martinez@example.com',
    avatarUrl: findImage('user-avatar-1').imageUrl,
    title: 'Skilled Trades Professional',
    location: 'Brooklyn, NY',
    summary: 'A versatile and reliable skilled trades professional with over 8 years of experience in both commercial and residential settings. Proficient in carpentry and basic electrical work, with a strong focus on quality craftsmanship and safety. Seeking a challenging role where I can apply my diverse skill set.',
    skills: ['Finish Carpentry', 'Framing', 'Drywall Installation', 'Basic Electrical Wiring', 'Fixture Installation', 'Blueprint Reading', 'Project Estimation'],
    experience: [
        {
            title: 'Lead Carpenter',
            company: 'BuildRight Contractors',
            duration: '2018 - Present',
            description: 'Led a team of 3 carpenters on various residential renovation projects. Managed project timelines, coordinated with other trades, and ensured high-quality finishing on all jobs.'
        },
        {
            title: 'Carpenter Apprentice',
            company: 'Solid Foundation Builders',
            duration: '2016 - 2018',
            description: 'Assisted senior carpenters in all aspects of construction, from framing to finish work. Developed a strong foundation in woodworking techniques and job site safety protocols.'
        }
    ],
    education: [
        {
            degree: 'Vocational Certificate in Carpentry',
            institution: 'Brooklyn Technical College',
            year: '2016'
        },
        {
            degree: 'OSHA 30-Hour Certification',
            institution: 'Online Safety Training',
            year: '2018'
        }
    ]
};
