import { userProfile } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Briefcase, Building, Calendar, GraduationCap, MapPin, Upload } from 'lucide-react';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProfilePage() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-8 md:col-span-1">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background ring-2 ring-primary">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
              <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{userProfile.title}</CardDescription>
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4"/>
                {userProfile.location}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{userProfile.summary}</p>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Your Profile</DialogTitle>
                    </DialogHeader>
                    <ProfileForm profile={userProfile} />
                </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload CV
            </Button>
          </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
            </CardContent>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-8 md:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {userProfile.experience.map((exp, index) => (
                    <div key={index} className="relative">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 pt-1">
                                <Briefcase className="w-5 h-5 text-muted-foreground"/>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{exp.title}</h3>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Building className="h-3 w-3" /> {exp.company}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                    <Calendar className="h-3 w-3" /> {exp.duration}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{exp.description}</p>
                            </div>
                        </div>
                        {index < userProfile.experience.length - 1 && <Separator className="mt-6" />}
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {userProfile.education.map((edu, index) => (
                    <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                            <GraduationCap className="w-5 h-5 text-muted-foreground"/>
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-semibold">{edu.degree}</h3>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <p className="text-xs text-muted-foreground mt-1">{edu.year}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
