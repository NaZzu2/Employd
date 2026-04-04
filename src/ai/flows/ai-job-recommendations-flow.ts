'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered job recommendations.
 *
 * - getJobRecommendations - A function that generates personalized job recommendations for an employee.
 * - JobRecommendationInput - The input type for the getJobRecommendations function.
 * - JobRecommendationOutput - The return type for the getJobRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobRecommendationInputSchema = z.object({
  employeeProfileSummary: z
    .string()
    .describe('A concise summary of the employee\'s professional profile.'),
  employeeSkills: z
    .array(z.string())
    .describe('A list of skills the employee possesses.'),
  employeePastInteractions: z
    .string()
    .describe(
      'A summary of the employee\'s past interactions within the app (e.g., "viewed \'Plumber needed\', pinged \'Electrician opening\'").'
    ),
  availableJobs: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the job posting.'),
        title: z.string().describe('Title of the job posting.'),
        description: z.string().describe('Detailed description of the job.'),
        requirements: z
          .array(z.string())
          .describe('List of required skills or qualifications for the job.'),
        location: z.string().optional().describe('Location of the job.'),
      })
    )
    .describe('An array of all job postings currently available.'),
});
export type JobRecommendationInput = z.infer<typeof JobRecommendationInputSchema>;

const JobRecommendationOutputSchema = z.object({
  recommendedJobs: z
    .array(
      z.object({
        id: z.string().describe('The ID of the recommended job.'),
        title: z.string().describe('The title of the recommended job.'),
        relevanceScore: z
          .number()
          .int()
          .min(1)
          .max(100)
          .describe(
            'A score from 1 to 100 indicating how relevant this job is to the employee profile.'
          ),
        rationale: z
          .string()
          .describe('A brief explanation of why this job is recommended.'),
      })
    )
    .describe('A list of recommended jobs with their relevance score and a brief rationale.'),
});
export type JobRecommendationOutput = z.infer<typeof JobRecommendationOutputSchema>;

export async function getJobRecommendations(
  input: JobRecommendationInput
): Promise<JobRecommendationOutput> {
  return aiJobRecommendationsFlow(input);
}

const aiJobRecommendationsPrompt = ai.definePrompt({
  name: 'aiJobRecommendationsPrompt',
  input: {schema: JobRecommendationInputSchema},
  output: {schema: JobRecommendationOutputSchema},
  prompt: `You are an intelligent job recommendation AI for blue-collar workers. Your goal is to match employees with the most relevant job postings based on their profile, skills, and past interactions.

Employee Profile Summary: {{{employeeProfileSummary}}}
Employee Skills:
{{#each employeeSkills}}- {{{this}}}
{{/each}}
Employee Past Interactions: {{{employeePastInteractions}}}

Here are the available job postings:
{{#each availableJobs}}
---
Job ID: {{{this.id}}}
Job Title: {{{this.title}}}
Description: {{{this.description}}}
Requirements:
{{#each this.requirements}}- {{{this}}}
{{/each}}
{{#if this.location}}Location: {{{this.location}}}{{/if}}
---
{{/each}}

Based on the employee's information and the available jobs, recommend the top 3-5 most relevant jobs. For each recommended job, provide its ID, title, a relevance score (1-100), and a brief rationale for the recommendation. The output must be a JSON object strictly adhering to the JobRecommendationOutputSchema.`,
});

const aiJobRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiJobRecommendationsFlow',
    inputSchema: JobRecommendationInputSchema,
    outputSchema: JobRecommendationOutputSchema,
  },
  async input => {
    const {output} = await aiJobRecommendationsPrompt(input);
    return output!;
  }
);
