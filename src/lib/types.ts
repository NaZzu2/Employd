export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
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
