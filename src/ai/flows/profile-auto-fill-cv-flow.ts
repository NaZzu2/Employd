'use server';
/**
 * @fileOverview A Genkit flow for automatically extracting key skills, work history, and qualifications from an employee's CV or description.
 *
 * - profileAutoFillCv - A function that handles the profile auto-fill process.
 * - ProfileAutoFillCvInput - The input type for the profileAutoFillCv function.
 * - ProfileAutoFillCvOutput - The return type for the profileAutoFillCv function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfileAutoFillCvInputSchema = z
  .object({
    cvDataUri: z
      .string()
      .optional()
      .describe(
        "A CV document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Can be a PDF or image." 
      ),
    description: z
      .string()
      .optional()
      .describe('A free-text description of the employee\'s experience, skills, and qualifications.'),
  })
  .refine(data => data.cvDataUri || data.description, {
    message: 'Either cvDataUri or description must be provided.',
    path: ['cvDataUri', 'description'], // This path is used for error reporting
  });
export type ProfileAutoFillCvInput = z.infer<typeof ProfileAutoFillCvInputSchema>;

const WorkHistorySchema = z.object({
  title: z.string().describe('The job title or role.'),
  company: z.string().describe('The name of the company.'),
  duration: z.string().describe('The period of employment (e.g., "Jan 2020 - Dec 2022" or "2 years").'),
  description: z.string().describe('A brief description of responsibilities and achievements.'),
});

const QualificationSchema = z.object({
  degree: z.string().optional().describe('The degree or certificate obtained (e.g., "Bachelor of Science", "Project Management Professional").'),
  institution: z.string().describe('The name of the educational institution or certifying body.'),
  year: z.string().optional().describe('The year of graduation or certification.'),
});

const ProfileAutoFillCvOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of key technical and soft skills.'),
  workHistory: z.array(WorkHistorySchema).describe('A chronological list of previous work experiences.'),
  qualifications: z.array(QualificationSchema).describe('A list of educational qualifications and certifications.'),
});
export type ProfileAutoFillCvOutput = z.infer<typeof ProfileAutoFillCvOutputSchema>;

export async function profileAutoFillCv(
  input: ProfileAutoFillCvInput
): Promise<ProfileAutoFillCvOutput> {
  return profileAutoFillCvFlow(input);
}

const profileAutoFillCvPrompt = ai.definePrompt({
  name: 'profileAutoFillCvPrompt',
  input: {schema: ProfileAutoFillCvInputSchema},
  output: {schema: ProfileAutoFillCvOutputSchema},
  prompt: `You are an expert HR assistant tasked with extracting professional profile information.

Extract key skills, work history, and qualifications from the provided CV document or free-text description.
Prioritize information from the CV if both are provided.

Return the extracted information in a structured JSON format matching the output schema provided.

Output JSON should conform to the following schema: {
  "skills": ["string"],
  "workHistory": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "qualifications": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string"
    }
  ]
}

{{#if cvDataUri}}
CV Document: {{media url=cvDataUri}}
{{/if}}

{{#if description}}
Description: {{{description}}}
{{/if}}
`,
});

const profileAutoFillCvFlow = ai.defineFlow(
  {
    name: 'profileAutoFillCvFlow',
    inputSchema: ProfileAutoFillCvInputSchema,
    outputSchema: ProfileAutoFillCvOutputSchema,
  },
  async input => {
    const {output} = await profileAutoFillCvPrompt(input);
    if (!output) {
      throw new Error('Failed to extract profile information.');
    }
    return output;
  }
);
