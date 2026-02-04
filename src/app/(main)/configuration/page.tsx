import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountSettings } from './components/account-settings';

export default function ConfigurationPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Simulate adding and removing follower accounts. Live connection is not available in this static version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSettings />
        </CardContent>
      </Card>
    </div>
  );
}
