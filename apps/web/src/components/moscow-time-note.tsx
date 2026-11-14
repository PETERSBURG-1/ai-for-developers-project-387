import { MOSCOW_TIME_ZONE_NOTE } from "@/lib/moscow-time";
import { cn } from "@/lib/utils";

interface MoscowTimeNoteProps {
  className?: string;
}

export function MoscowTimeNote({ className }: MoscowTimeNoteProps) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{MOSCOW_TIME_ZONE_NOTE}</p>;
}
