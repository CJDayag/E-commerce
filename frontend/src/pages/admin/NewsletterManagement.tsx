import { useEffect, useMemo, useState } from 'react';
import API from '@/services/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface NewsletterSubscriber {
  id: number;
  email: string;
  active: boolean;
  created_at: string;
}

export default function NewsletterManagement() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/marketing/subscribers/');
      setSubscribers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch newsletter subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleExport = async () => {
    try {
      const response = await API.get('/api/marketing/subscribers/export/', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'newsletter_subscribers.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export ready');
    } catch (error) {
      console.error('Failed to export subscribers:', error);
      toast.error('Failed to export subscribers');
    }
  };

  const filteredSubscribers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return subscribers;
    }
    return subscribers.filter((subscriber) => subscriber.email.toLowerCase().includes(normalizedQuery));
  }, [query, subscribers]);

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => subscriber.active).length,
    [subscribers]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground">View and export your email list.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{activeCount} active</Badge>
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>Search and review recent sign-ups.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button variant="outline" onClick={fetchSubscribers}>Refresh</Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">Loading subscribers...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No subscribers found</TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.active ? 'default' : 'secondary'}>
                          {subscriber.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(subscriber.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
