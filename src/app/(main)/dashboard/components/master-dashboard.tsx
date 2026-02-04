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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

export function MasterDashboard() {
  const { followerAccounts, brokerAccounts } = useAccount();
  const previewCount = 6;

  return (
    <div className="flex flex-col gap-6">
      {/* Trades on top */}
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

      {/* Broker accounts summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Broker Accounts</h2>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/configuration">Manage Brokers</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brokerAccounts.length > 0 ? (
            brokerAccounts.map((b) => (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription>{b.brokerUrl}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-mono">{b.status}{b.sessionId ? ` • SID ${b.sessionId.slice(0,6)}...` : ''}</span>
                    </div>
                    {b.lastError && <div className="text-sm text-destructive">{b.lastError}</div>}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>No Broker Accounts</CardTitle>
                <CardDescription>
                  Add a broker account to connect your master account (Alice Blue supported).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/configuration">Add Broker</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Followers summary below trades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Follower Accounts</h2>
          <div className="flex items-center gap-2">
            {followerAccounts.length > previewCount && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">Show all followers</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>All Followers ({followerAccounts.length})</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {followerAccounts.map((account) => (
                      <FollowerCard key={account.id} account={account} />
                    ))}
                  </div>
                  <div className="mt-4 text-right">
                    <DialogClose asChild>
                      <Button variant="secondary" size="sm">Close</Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button asChild size="sm">
              <Link href="/configuration">Manage Followers</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {followerAccounts.length > 0 ? (
            followerAccounts.slice(0, previewCount).map((account) => (
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

        {followerAccounts.length > previewCount && (
          <div className="mt-4 flex justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href="/configuration">See more</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
