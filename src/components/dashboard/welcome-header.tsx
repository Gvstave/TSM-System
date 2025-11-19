import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Plus } from 'lucide-react';

interface WelcomeHeaderProps {
  user: User;
  actionSlot?: React.ReactNode;
}

export function WelcomeHeader({ user, actionSlot }: WelcomeHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back, {user.name.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's on your plate for today.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {actionSlot}
      </div>
    </div>
  );
}
