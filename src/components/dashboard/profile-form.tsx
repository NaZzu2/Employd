"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserProfile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { profileAutoFillCv } from "@/ai/flows/profile-auto-fill-cv-flow"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  title: z.string().min(2, "Title must be at least 2 characters."),
  location: z.string().min(2, "Location must be at least 2 characters."),
  summary: z.string().min(10, "Summary must be at least 10 characters."),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm({ profile }: { profile: UserProfile }) {
    const { toast } = useToast()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: profile.name,
            email: profile.email,
            title: profile.title,
            location: profile.location,
            summary: profile.summary,
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        })
    }
    
    async function handleAutoFill() {
        toast({
            title: "Auto-filling profile...",
            description: "Please wait while we analyze your CV.",
        });

        try {
            // In a real app, you would get the CV data URI from a file upload.
            // Here, we use the description field for demonstration.
            const result = await profileAutoFillCv({ description: profile.summary + " " + profile.experience.map(e => e.description).join(" ") });

            if (result.workHistory[0]) {
                form.setValue("title", result.workHistory[0].title);
            }
            if (result.skills.length > 0) {
                form.setValue("summary", `Skilled in: ${result.skills.join(', ')}. ` + profile.summary);
            }
            toast({
                title: "Profile Auto-filled!",
                description: "We've updated your profile based on our analysis.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Auto-fill Failed",
                description: "We couldn't analyze the provided information. Please try again.",
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={handleAutoFill}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Auto-fill with AI
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Professional Title</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Professional Summary</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Tell us a little bit about yourself"
                            className="resize-none"
                            rows={5}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Save changes</Button>
            </form>
        </Form>
    )
}
