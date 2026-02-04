import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FollowerAccount } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FollowerCardProps {
  account: FollowerAccount;
}

export function FollowerCard({ account }: FollowerCardProps) {
  const getStatusVariant = (status: FollowerAccount['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:red-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>
              {account.id}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn('border-transparent', getStatusVariant(account.status))}
          >
            {account.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Today's P/L</p>
          <p
            className={cn(
              'text-2xl font-bold',
              account.currentPL >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {account.currentPL >= 0 ? '+' : ''}₹
            {Math.abs(account.currentPL).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Lot Multiplier:</span>
            <span className="font-medium text-foreground">
              {account.lotMultiplier}x
            </span>
          </div>
          <div className="flex justify-between">
            <span>Risk Profile:</span>
            <span className="font-medium text-foreground">
              {account.riskProfile}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/risk-management?account=${account.id}`}>
            Manage Settings <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
