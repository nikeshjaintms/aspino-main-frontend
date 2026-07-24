"use client";

import { AspinoLogo } from "@/components/aspino-logo";

export function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="animate-float">
          <AspinoLogo size="xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-aspino-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="inline-block w-2 h-2 rounded-full bg-aspino-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="inline-block w-2 h-2 rounded-full bg-aspino-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-fade-in delay-300">
          {message}
        </p>
      </div>
    </div>
  );
}
