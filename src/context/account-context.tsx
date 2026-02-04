"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { followerAccounts as initialFollowerAccounts, type FollowerAccount, brokerAccounts as initialBrokerAccounts, type BrokerAccount } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { obtainSessionId } from '@/lib/alice';

export interface NewFollowerInfo {
  id: string;
  name: string;
  telegramId?: string;
  initialBalance: number;
  lotMultiplier: number;
}

interface ManualTradeInput {
    symbol: string;
    side: 'Buy' | 'Sell';
    quantity: number;
    price: number;
}

export interface FollowerTrade extends ManualTradeInput {
    id: string;
    timestamp: string;
}

export type FollowerTrades = {
    [followerId: string]: FollowerTrade[];
}

interface AccountContextType {
  followerAccounts: FollowerAccount[];
  followerTrades: FollowerTrades;
  brokerAccounts: BrokerAccount[];
  addFollower: (info: NewFollowerInfo) => { success: boolean; message: string; password?: string, username?: string };
  removeFollower: (accountId: string) => void;
  updateFollowerSettings: (accountId: string, settings: Partial<Omit<FollowerAccount, 'id' | 'username' | 'password'>>) => void;
  addFollowerTrade: (followerId: string, tradeInput: ManualTradeInput) => void;
  addBroker: (info: Omit<BrokerAccount, 'id' | 'status' | 'sessionId' | 'lastError'>) => { success: boolean; message: string; id?: string };
  removeBroker: (brokerId: string) => void;
  connectBroker: (brokerId: string) => Promise<{ success: boolean; message: string }>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [followerAccounts, setFollowerAccounts] = useState<FollowerAccount[]>(initialFollowerAccounts);
  const [followerTrades, setFollowerTrades] = useState<FollowerTrades>({});
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>(initialBrokerAccounts);

  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem('followerAccounts');
      if (storedAccounts) {
        setFollowerAccounts(JSON.parse(storedAccounts));
      } else {
        setFollowerAccounts(initialFollowerAccounts);
      }
      const storedTrades = localStorage.getItem('followerTrades');
      if (storedTrades) {
        setFollowerTrades(JSON.parse(storedTrades));
      }

      const storedBrokers = localStorage.getItem('brokerAccounts');
      if (storedBrokers) {
        setBrokerAccounts(JSON.parse(storedBrokers));
      } else {
        setBrokerAccounts(initialBrokerAccounts);
      }
    } catch (e) {
        console.error("Failed to parse from localStorage", e);
        // If parsing fails, reset to initial state
        setFollowerAccounts(initialFollowerAccounts);
        setFollowerTrades({});
        setBrokerAccounts(initialBrokerAccounts);
    }
  }, []);

  const saveData = (accounts: FollowerAccount[], trades: FollowerTrades, brokers?: BrokerAccount[]) => {
    localStorage.setItem('followerAccounts', JSON.stringify(accounts));
    localStorage.setItem('followerTrades', JSON.stringify(trades));
    if (brokers) localStorage.setItem('brokerAccounts', JSON.stringify(brokers));
  };

  const addFollower = (info: NewFollowerInfo) => {
    if (followerAccounts.some(acc => acc.id.toLowerCase() === info.id.toLowerCase())) {
        return { success: false, message: 'An account with this ID already exists.' };
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const newUsername = info.name.toLowerCase().replace(/\s/g, '') + Math.floor(10 + Math.random() * 90);

    const newAccount: FollowerAccount = {
      id: info.id,
      name: info.name,
      username: newUsername,
      password: newPassword,
      telegramId: info.telegramId,
      initialBalance: info.initialBalance,
      riskProfile: 'Moderate',
      lotMultiplier: info.lotMultiplier,
      perAccountCap: 100000,
      dailyLossLimit: 5000,
      maxExposurePerSymbol: 25000,
      currentPL: 0,
      status: 'Active',
    };

    const updatedAccounts = [...followerAccounts, newAccount];
    setFollowerAccounts(updatedAccounts);
    saveData(updatedAccounts, followerTrades, brokerAccounts);
    
    return { success: true, message: 'Follower added successfully.', password: newPassword, username: newUsername };
  };

  const removeFollower = (accountId: string) => {
    const updatedAccounts = followerAccounts.filter(acc => acc.id !== accountId);
    setFollowerAccounts(updatedAccounts);
    
    const newTrades = {...followerTrades};
    delete newTrades[accountId];
    setFollowerTrades(newTrades);
    
    saveData(updatedAccounts, newTrades, brokerAccounts);

    toast({
      title: 'Account Removed',
      description: `Account ${accountId} has been removed.`,
    });
  };

  const addFollowerTrade = (followerId: string, tradeInput: ManualTradeInput) => {
    const newTrade: FollowerTrade = {
      ...tradeInput,
      id: `FT${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updatedTrades = {
        ...followerTrades,
        [followerId]: [...(followerTrades[followerId] || []), newTrade]
    };
    setFollowerTrades(updatedTrades);
    saveData(followerAccounts, updatedTrades, brokerAccounts);
  };
  
  const updateFollowerSettings = (accountId: string, settings: Partial<Omit<FollowerAccount, 'id' | 'username' | 'password'>>) => {
      const updatedAccounts = followerAccounts.map(acc => 
          acc.id === accountId ? { ...acc, ...settings } : acc
      );
      setFollowerAccounts(updatedAccounts);
      saveData(updatedAccounts, followerTrades, brokerAccounts);
      toast({
          title: "Settings Updated",
          description: `Settings for ${accountId} have been saved.`
      })
  };

  const addBroker = (info: Omit<BrokerAccount, 'id' | 'status' | 'sessionId' | 'lastError'>) => {
    const id = `${info.name.replace(/\s+/g, '').toUpperCase().slice(0,6)}-${Date.now()}`;
    if (brokerAccounts.some(b => b.name.toLowerCase() === info.name.toLowerCase())) {
      return { success: false, message: 'Broker with this name already exists.' };
    }

    const newBroker: BrokerAccount = {
      id,
      name: info.name,
      brokerUrl: info.brokerUrl,
      apiKey: info.apiKey,
      apiSecret: info.apiSecret,
      appId: info.appId,
      userId: info.userId,
      password: info.password,
      twoFA: info.twoFA,
      sessionId: undefined,
      status: 'Disconnected',
    };

    const updated = [...brokerAccounts, newBroker];
    setBrokerAccounts(updated);
    saveData(followerAccounts, followerTrades, updated);
    toast({ title: 'Broker Added', description: `${newBroker.name} added.` });
    return { success: true, message: 'Broker added', id };
  };

  const removeBroker = (brokerId: string) => {
    const updated = brokerAccounts.filter(b => b.id !== brokerId);
    setBrokerAccounts(updated);
    saveData(followerAccounts, followerTrades, updated);
    toast({ title: 'Broker Removed', description: `Broker ${brokerId} removed.` });
  };

  const connectBroker = async (brokerId: string) : Promise<{ success: boolean; message: string }> => {
    const broker = brokerAccounts.find(b => b.id === brokerId);
    if (!broker) return { success: false, message: 'Broker not found' };

    // Only support Alice Blue for now
    if (!broker.brokerUrl.includes('alice')) {
      return { success: false, message: 'Only Alice Blue is supported right now' };
    }

    // Mark as connecting
    const updating = brokerAccounts.map(b => b.id === brokerId ? { ...b, status: 'Connecting' as BrokerAccount['status'], lastError: undefined } : b);
    setBrokerAccounts(updating);
    saveData(followerAccounts, followerTrades, updating);

    try {
      const sessionId = await obtainSessionId({ userId: broker.userId || '', password: broker.password || '', twoFA: broker.twoFA || '', appId: broker.appId || '' });
      const updated = brokerAccounts.map(b => b.id === brokerId ? { ...b, sessionId, status: 'Connected' as BrokerAccount['status'], lastError: undefined } : b);
      setBrokerAccounts(updated);
      saveData(followerAccounts, followerTrades, updated);
      toast({ title: 'Broker Connected', description: `${broker.name} connected successfully.` });
      return { success: true, message: 'Connected' };
    } catch (err: any) {
      const updated = brokerAccounts.map(b => b.id === brokerId ? { ...b, status: 'Error' as BrokerAccount['status'], lastError: err?.message ?? 'Failed to connect' } : b);
      setBrokerAccounts(updated);
      saveData(followerAccounts, followerTrades, updated);
      toast({ variant: 'destructive', title: 'Connection Failed', description: err?.message ?? 'Failed to connect' });
      return { success: false, message: err?.message ?? 'Failed to connect' };
    }
  };

  return (
    <AccountContext.Provider value={{ 
        followerAccounts, 
        followerTrades,
        brokerAccounts,
        addFollower, 
        removeFollower, 
        updateFollowerSettings,
        addFollowerTrade,
        addBroker,
        removeBroker,
        connectBroker
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
