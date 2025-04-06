"use client";

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export default function ClientTooltip({
  children,
  text,
  content,
}: {
  children: React.ReactNode;
  text?: string;
  content?: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content || text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
