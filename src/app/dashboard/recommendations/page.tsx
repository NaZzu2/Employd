'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { jobs, userProfile } from '@/lib/data';
import { getJobRecommendations, type JobRecommendationOutput } from '@/ai/flows/ai-job-recommendations-flow';
import { Loader, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<JobRecommendationOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setRecommendations(null);
        try {
            const result = await getJobRecommendations({
                employeeProfileSummary: userProfile.summary,
                employeeSkills: userProfile.skills,
                employeePastInteractions: "viewed 'Plumber needed', pinged 'Electrician opening'",
                availableJobs: jobs.map(j => ({
                    id: j.id,
                    title: j.title,
                    description: j.description,
                    requirements: j.requirements,
                    location: j.location,
                }))
            });
            setRecommendations(result);
        } catch (error) {
            console.error('Failed to get job recommendations:', error);
            toast({
                variant: 'destructive',
                title: 'Recommendation Error',
                description: 'Could not fetch AI-powered recommendations. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <Card className="text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mb-4">
                        <Wand2 className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-headline">AI Job Recommendations</CardTitle>
                    <CardDescription>
                        Let our AI find the best jobs for you based on your profile, skills, and interests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGetRecommendations} disabled={isLoading} size="lg">
                        {isLoading ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Generate My Top Matches'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {recommendations && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Here are your top matches:</h2>
                    <div className="space-y-4">
                        {recommendations.recommendedJobs
                        .sort((a, b) => b.relevanceScore - a.relevanceScore)
                        .map(rec => (
                            <Card key={rec.id} className="hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">
                                                <Link href={`/dashboard/jobs/${rec.id}`} className="hover:underline">
                                                    {rec.title}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription>{jobs.find(j => j.id === rec.id)?.company}</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-primary">{rec.relevanceScore}%</p>
                                            <p className="text-xs text-muted-foreground">Match</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Progress value={rec.relevanceScore} className="h-2" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">&quot;{rec.rationale}&quot;</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
