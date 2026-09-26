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
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'PERCENT' | 'FIXED';
  amount: string | number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
}

const toDateTimeInput = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function PromoCodeManagement() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [amount, setAmount] = useState('');
  const [active, setActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('PERCENT');
    setAmount('');
    setActive(true);
    setStartsAt('');
    setEndsAt('');
    setUsageLimit('');
    setEditingPromo(null);
  };

  const populateForm = (promo: PromoCode) => {
    setCode(promo.code);
    setDescription(promo.description || '');
    setDiscountType(promo.discount_type);
    setAmount(String(promo.amount));
    setActive(promo.active);
    setStartsAt(toDateTimeInput(promo.starts_at));
    setEndsAt(toDateTimeInput(promo.ends_at));
    setUsageLimit(promo.usage_limit ? String(promo.usage_limit) : '');
    setEditingPromo(promo);
  };

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/orders/promocodes/');
      setPromos(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discount_type: discountType,
      amount: Number(amount) || 0,
      active,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
    };

    try {
      if (editingPromo) {
        await API.put(`/api/orders/promocodes/${editingPromo.id}/`, payload);
        toast.success('Promo code updated');
      } else {
        await API.post('/api/orders/promocodes/', payload);
        toast.success('Promo code created');
      }
      resetForm();
      fetchPromos();
    } catch (error) {
      console.error('Failed to save promo code:', error);
      toast.error('Failed to save promo code');
    }
  };

  const handleDelete = async (promoId: number) => {
    if (!window.confirm('Delete this promo code?')) {
      return;
    }

    try {
      await API.delete(`/api/orders/promocodes/${promoId}/`);
      toast.success('Promo code deleted');
      fetchPromos();
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const activeCount = useMemo(() => promos.filter((promo) => promo.active).length, [promos]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Create, schedule, and manage active discounts.</p>
        </div>
        <Badge variant="secondary">{activeCount} active</Badge>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</CardTitle>
          <CardDescription>Use uppercase codes and optional schedules for launches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="CODE" value={code} onChange={(event) => setCode(event.target.value)} />
            <Input placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
            <Select value={discountType} onValueChange={(value: 'PERCENT' | 'FIXED') => setDiscountType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Discount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percent (%)</SelectItem>
                <SelectItem value="FIXED">Fixed amount ($)</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Input placeholder="Starts at" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
            <Input placeholder="Ends at" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
            <Input placeholder="Usage limit" type="number" value={usageLimit} onChange={(event) => setUsageLimit(event.target.value)} />
            <Select value={active ? 'active' : 'inactive'} onValueChange={(value) => setActive(value === 'active')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleSubmit}>{editingPromo ? 'Update' : 'Create'}</Button>
            {editingPromo && (
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading promo codes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No promo codes yet</TableCell>
                  </TableRow>
                ) : (
                  promos.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.code}</TableCell>
                      <TableCell>{promo.discount_type}</TableCell>
                      <TableCell>{promo.discount_type === 'PERCENT' ? `${promo.amount}%` : `$${promo.amount}`}</TableCell>
                      <TableCell>
                        <Badge variant={promo.active ? 'default' : 'secondary'}>
                          {promo.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {promo.starts_at ? new Date(promo.starts_at).toLocaleString() : '—'}
                        {' / '}
                        {promo.ends_at ? new Date(promo.ends_at).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        {promo.usage_limit ? `${promo.usage_count}/${promo.usage_limit}` : promo.usage_count}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => populateForm(promo)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(promo.id)}>
                            Delete
                          </Button>
                        </div>
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
