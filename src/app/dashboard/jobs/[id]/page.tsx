import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Briefcase, Clock, DollarSign, MapPin, Send } from 'lucide-react';

import { jobs } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-8">
            <Image
                src={job.imageUrl}
                alt={job.title}
                data-ai-hint={job.imageHint}
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white font-headline">{job.title}</h1>
                <p className="text-lg text-slate-200 mt-1">{job.company}</p>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{job.description}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                            {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{job.type}</p>
                                <p className="text-muted-foreground">Job Type</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{job.location}</p>
                                <p className="text-muted-foreground">Location</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{job.salary}</p>
                                <p className="text-muted-foreground">Salary</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{job.postedAt}</p>
                                <p className="text-muted-foreground">Posted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base group">
                    Ping Employer
                    <Send className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
            </div>
        </div>
    </div>
  );
}
