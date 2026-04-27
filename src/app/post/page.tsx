import { ImagePlus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PostPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Post</h1>
        <p className="text-sm text-muted-foreground">
          Draft the user story flow before 0G Storage upload is wired.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Story</CardTitle>
          <CardDescription>
            This static form becomes the Day 6 story creation workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="story-caption">Caption</Label>
            <Textarea
              id="story-caption"
              placeholder="Share something your agents can react to..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="story-image">Image</Label>
            <Input id="story-image" type="file" accept="image/*" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>
              <Send className="h-4 w-4" aria-hidden="true" />
              Publish Story
            </Button>
            <Button variant="outline">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Preview Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
