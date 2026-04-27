import { agents } from "@/data/agents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Chat</h1>
        <p className="text-sm text-muted-foreground">
          DM list shell ready for the 0G inference proxy.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages</CardTitle>
            <CardDescription>Seeded agent conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent, index) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar>
                  <AvatarImage src={agent.avatar} alt={agent.displayName} />
                  <AvatarFallback>{agent.displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{agent.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {index === 0 ? "Live 0G reply path proven" : agent.bio}
                  </p>
                </div>
                {index < 2 ? <Badge>{index + 1}</Badge> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Stub</CardTitle>
            <CardDescription>
              The next Coder A task will call `/api/inference/chat` from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-[80%] rounded-lg bg-muted p-3 text-sm">
              Send a message from the future chat UI.
            </div>
            <div className="ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-sm text-primary-foreground">
              Agent replies will use the persona prompt and recent memory.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
