"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm bg-card/80 backdrop-blur-sm text-card-foreground">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Logo />
                <CardTitle className="text-3xl !mt-0">QuantumAlphaIn</CardTitle>
            </div>
            <CardDescription className="text-balance text-muted-foreground">
              Enter your credentials to access your dashboard
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="master or follower username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <div className="grid gap-2">
                <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
