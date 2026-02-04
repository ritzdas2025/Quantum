"use client";

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TradesTableProps {
  showAccount?: boolean;
}

type RemoteTrade = {
  id: string;
  timestamp: string;
  account: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price: number;
  status: string;
}

export function TradesTable({ showAccount = true }: TradesTableProps) {
  const [loading, setLoading] = useState(true);
  const [masterTrades, setMasterTrades] = useState<RemoteTrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Filled':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Partial Fill':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:red-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alice/trades');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const payload = await res.json();
      setMasterTrades(payload.trades ?? []);
    } catch (e: any) {
      console.error('Failed to fetch trades', e);
      setError(e?.message ?? 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const id = setInterval(fetchTrades, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full overflow-auto">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">Error loading trades: {error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              {showAccount && <TableHead>Account</TableHead>}
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {masterTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAccount ? 8 : 7} className="h-24 text-center">
                  No trades found for the master account today.
                </TableCell>
              </TableRow>
            ) : (
              masterTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{trade.timestamp}</TableCell>
                  {showAccount && (
                    <TableCell>
                      <Badge variant={trade.account === 'Master' ? 'default' : 'secondary'}>
                        {trade.account}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>{trade.type}</TableCell>
                  <TableCell className={cn(trade.side === 'Buy' ? 'text-green-600' : 'text-red-600')}>
                    {trade.side}
                  </TableCell>
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                  <TableCell className="text-right">₹{trade.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn('border-transparent', getStatusVariant(trade.status))}>
                      {trade.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
