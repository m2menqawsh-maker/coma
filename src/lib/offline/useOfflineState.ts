/**
 * useOfflineState Hook
 * 
 * Hook لاستخدام نظام إدارة حالة الأوفلاين في المكونات
 * يوفر:
 * - الحالة الحالية (online/offline/syncing)
 * - عدد العمليات المعلقة
 * - دوال للتحكم بالطابور
 * - تحديثات فورية عند تغيير الحالة
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getOfflineStateManager, type OfflineStatus } from "./offlineStateManager";

interface UseOfflineStateReturn {
  status: OfflineStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  addToQueue: (request: any) => void;
  getQueue: () => any[];
  clearQueue: () => void;
}

export function useOfflineState(): UseOfflineStateReturn {
  const manager = getOfflineStateManager();
  const [status, setStatus] = useState<OfflineStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // تحديث الحالة الأولية
    setStatus(manager.getStatus());
    setPendingCount(manager.getPendingCount());

    // الاشتراك في التحديثات
    const unsubscribe = manager.subscribe((event) => {
      if (event.type === "status_changed") {
        setStatus(event.data.status);
      } else if (event.type === "queue_updated") {
        setPendingCount(event.data.queueLength);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [manager]);

  const addToQueue = useCallback(
    (request: any) => {
      manager.addToQueue(request);
    },
    [manager]
  );

  const getQueue = useCallback(() => {
    return manager.getQueue();
  }, [manager]);

  const clearQueue = useCallback(() => {
    manager.clearQueue();
  }, [manager]);

  return {
    status,
    isOnline: status === "online",
    isSyncing: status === "syncing",
    pendingCount,
    addToQueue,
    getQueue,
    clearQueue,
  };
}
