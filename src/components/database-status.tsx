
'use client';

import { useAppData } from '@/hooks/use-app-data';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function DatabaseStatus() {
  const { isDbConnected, isAppDataLoading } = useAppData();

  if (isAppDataLoading) {
    return (
      <div className="hidden sm:flex items-center justify-center p-2 rounded-md w-[90px] h-9">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden sm:flex items-center justify-center gap-2 p-2 rounded-md border bg-background text-foreground text-sm shadow-inner">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isDbConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="font-mono text-xs font-semibold">
            {isDbConnected ? 'Online' : 'Local'}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isDbConnected
            ? 'Connected to PostgreSQL database.'
            : 'Running in local storage mode.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
