import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { MoreVertical, Settings2, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface AgentCardProps {
  name: string
  role: string
  model: string
  status: "active" | "idle"
  weight: number
  avatar: string
}

export function AgentCard({ name, role, model, status, weight, avatar }: AgentCardProps) {
  return (
    <Card className="overflow-hidden group hover:border-primary/50 transition-all border-border/50 bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={avatar || "/placeholder.svg"} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              {status === "active" && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-card" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">{name}</h3>
                <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none uppercase tracking-tighter">
                  {model}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>Influence Weight</span>
            <span className="text-primary">{weight}%</span>
          </div>
          <Slider defaultValue={[weight]} max={100} step={1} className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3" />
        </div>

        <div className="mt-4 flex gap-2 pt-4 border-t border-border/50">
          <Button variant="secondary" size="sm" className="h-7 text-[10px] flex-1 bg-muted/50 hover:bg-muted">
            <Settings2 className="mr-1 h-3 w-3" /> Config
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] flex-1 border-primary/20 hover:bg-primary/10 bg-transparent"
          >
            <Zap className="mr-1 h-3 w-3 text-primary" /> Boost
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
