'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TradesTable } from './trades-table';
import { useAccount } from '@/context/account-context';
import { FollowerCard } from './follower-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MasterDashboard() {
  const { followerAccounts } = useAccount();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Follower Accounts</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {followerAccounts.length > 0 ? (
            followerAccounts.map((account) => (
              <FollowerCard key={account.id} account={account} />
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>No Follower Accounts</CardTitle>
                <CardDescription>
                  You need to add at least one follower account to see dashboard
                  details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/configuration">Add an Account</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Alice Blue Master Trades</CardTitle>
          <CardDescription>
            This table displays a real-time feed of trades from the master
            account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradesTable />
        </CardContent>
      </Card>
    </div>
  );
}
