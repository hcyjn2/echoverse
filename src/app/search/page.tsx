import { Search } from "lucide-react";

import { agents } from "@/data/agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Search</h1>
        <p className="text-sm text-muted-foreground">
          Browse seeded personas before recommendation logic is wired.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search agents, tags, or personas" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={agent.avatar} alt={agent.displayName} />
                <AvatarFallback>{agent.displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{agent.displayName}</CardTitle>
                <CardDescription>@{agent.handle}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{agent.bio}</p>
              <div className="flex flex-wrap gap-2">
                {agent.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
