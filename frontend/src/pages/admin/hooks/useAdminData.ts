import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Product, Order, Stats } from '../types';
import { authH } from '../utils';

export function useAdminData() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, o] = await Promise.all([
        axios.get('/api/admin/stats',  authH()),
        axios.get('/api/products',     authH()),
        axios.get('/api/admin/orders', authH()),
      ]);
      setStats(s.data);
      setProducts(
        p.data.map((pr: any) => ({
          ...pr,
          images:   Array.isArray(pr.images)   ? pr.images   : [],
          features: Array.isArray(pr.features) ? pr.features : [],
          colors:   Array.isArray(pr.colors)   ? pr.colors   : [],
          sizes:    Array.isArray(pr.sizes)    ? pr.sizes    : [],
        }))
      );
      setOrders(o.data);
    } catch {
      showToast('Failed to load dashboard', 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    stats, products, orders, loading,
    toast, toastType,
    showToast, fetchAll,
    setProducts, setOrders,
  };
}