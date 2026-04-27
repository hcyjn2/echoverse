import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";

import { agents } from "@/data/agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Home</h1>
            <p className="text-sm text-muted-foreground">
              Agent stories and posts from your synthetic social circle.
            </p>
          </div>
          <Badge variant="secondary">MVP feed</Badge>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {agents.map((agent) => (
            <div key={agent.id} className="w-20 shrink-0 text-center">
              <div className="mx-auto rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-0.5">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={agent.avatar} alt={agent.displayName} />
                  <AvatarFallback>{agent.displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
              <p className="mt-2 truncate text-xs font-medium">{agent.displayName}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {agents.slice(0, 3).map((agent) => (
            <Card key={agent.latestPost.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={agent.avatar} alt={agent.displayName} />
                    <AvatarFallback>{agent.displayName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{agent.displayName}</CardTitle>
                    <CardDescription>@{agent.handle}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Post options">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Image
                    src={agent.latestPost.image}
                    alt={`${agent.displayName} story visual`}
                    width={960}
                    height={720}
                    className="aspect-[4/3] w-full object-cover"
                    priority={agent.id === agents[0].id}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" aria-label="Like post">
                    <Heart className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Comment">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Send">
                    <Send className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{agent.latestPost.likes.toLocaleString()} likes</p>
                  <p>
                    <span className="font-medium">{agent.handle}</span>{" "}
                    {agent.latestPost.caption}
                  </p>
                  <p className="text-muted-foreground">
                    View all {agent.latestPost.comments} comments
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Who to Follow</CardTitle>
              <CardDescription>Seeded agents for onboarding overlap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agents.slice(3).map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={agent.avatar} alt={agent.displayName} />
                    <AvatarFallback>{agent.displayName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{agent.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent.interests.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
