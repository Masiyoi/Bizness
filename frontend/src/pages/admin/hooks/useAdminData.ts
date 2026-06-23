import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Product, Order, Stats } from '../types';
import { authH } from '../utils';
import { defaultDateRange } from '../constants';
import type { DateRange } from '../constants';

export function useAdminData() {
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const fetchAll = useCallback(async (range?: DateRange) => {
    const r = range ?? dateRange;
    setLoading(true);
    try {
      const params = `?from=${r.from}&to=${r.to}`;
      const [s, p, o] = await Promise.all([
        axios.get(`/api/admin/stats${params}`,  authH()),
        axios.get('/api/products',               authH()),
        axios.get('/api/admin/orders',           authH()),
      ]);

      setStats(s.data);
      setProducts(
        p.data.map((pr: any) => ({
          ...pr,
          images:     Array.isArray(pr.images)   ? pr.images   : [],
          features:   Array.isArray(pr.features) ? pr.features : [],
          colors:     Array.isArray(pr.colors)   ? pr.colors   : [],
          sizes:      Array.isArray(pr.sizes)    ? pr.sizes    : [],
          cost_price: pr.cost_price ? parseFloat(pr.cost_price) : null,
        }))
      );
      setOrders(o.data);
    } catch {
      showToast('Failed to load dashboard', 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast, dateRange]);

  const changeDateRange = useCallback((r: DateRange) => {
    setDateRange(r);
    fetchAll(r);
  }, [fetchAll]);

  return {
    stats, products, orders, loading,
    toast, toastType,
    dateRange, changeDateRange,
    showToast, fetchAll,
    setProducts, setOrders,
  };
}