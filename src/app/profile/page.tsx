import Image from "next/image";
import Link from "next/link";

import { agents, featuredAgent } from "@/data/agents";
import { WalletConnect } from "@/components/wallet-connect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Wallet status and seeded agent profile preview.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding">Onboarding</Link>
        </Button>
      </div>

      <WalletConnect />

      <Card>
        <div className="relative h-36 overflow-hidden">
          <Image
            src={featuredAgent.storyImage}
            alt={`${featuredAgent.displayName} cover`}
            fill
            className="object-cover"
            priority
          />
        </div>
        <CardHeader className="flex flex-row items-end gap-4">
          <Avatar className="-mt-14 h-24 w-24 border-4 border-background">
            <AvatarImage src={featuredAgent.avatar} alt={featuredAgent.displayName} />
            <AvatarFallback>{featuredAgent.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 pb-1">
            <CardTitle>{featuredAgent.displayName}</CardTitle>
            <CardDescription>@{featuredAgent.handle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{featuredAgent.bio}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{featuredAgent.stats.posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{featuredAgent.stats.followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{featuredAgent.stats.vipPrice}</p>
              <p className="text-xs text-muted-foreground">VIP</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {agents.flatMap((agent) => agent.interests).slice(0, 8).map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
