/**
 * Offline State Manager
 * 
 * نظام مركزي لإدارة حالة الأوفلاين والتواصل بين المكونات
 * يوفر:
 * - كشف فوري للانقطاع والاتصال
 * - نظام أحداث موحد
 * - تتبع حالة المزامنة
 * - إدارة طابور العمليات الأوفلاين
 */

type OfflineStatus = "online" | "offline" | "syncing" | "checking";
type EventType = 
  | "status_changed" 
  | "queue_updated" 
  | "sync_started" 
  | "sync_completed" 
  | "sync_failed"
  | "heartbeat_failed"
  | "connection_restored";

interface OfflineEvent {
  type: EventType;
  timestamp: number;
  data?: any;
}

interface OfflineStateListener {
  (event: OfflineEvent): void;
}

class OfflineStateManager {
  private status: OfflineStatus = "online";
  private listeners: Set<OfflineStateListener> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatFailures = 0;
  private maxHeartbeatFailures = 2;
  private lastHeartbeatTime = Date.now();
  private pendingQueue: any[] = [];
  private isSyncing = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeListeners();
      this.startHeartbeat();
      this.loadQueueFromStorage();
    }
  }

  /**
   * تهيئة مستمعي أحداث الشبكة
   */
  private initializeListeners() {
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());
    
    // استمع إلى أحداث مخصصة من Supabase client
    window.addEventListener("supabase_online", () => this.handleOnline());
    window.addEventListener("supabase_offline", () => this.handleOffline());

    // تحديث الطابور عند تغييره من قبل client.ts
    window.addEventListener("offline_queue_updated", () => {
      this.loadQueueFromStorage();
      this.emit({
        type: "queue_updated",
        timestamp: Date.now(),
        data: { queueLength: this.pendingQueue.length },
      });
    });
  }

  /**
   * بدء فحص دوري للاتصال (Heartbeat)
   * يرسل طلب خفيف كل 5 ثوانٍ للتحقق من الاتصال الفعلي
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      // نتحقق من الاتصال حتى لو كانت حالتنا الداخلية offline لنتمكن من التعافي تلقائياً
      if (navigator.onLine) {
        this.performHeartbeat();
      }
    }, 5000); // كل 5 ثوانٍ
  }

  /**
   * إجراء فحص Heartbeat للتحقق من الاتصال الفعلي
   */
  private async performHeartbeat() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // timeout 2 ثانية

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?limit=1`,
        {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
          },
        }
      );

      clearTimeout(timeoutId);
      this.lastHeartbeatTime = Date.now();
      this.heartbeatFailures = 0;

      if (!response.ok && response.status !== 404 && response.status !== 401) {
        throw new Error(`Heartbeat failed with status ${response.status}`);
      }

      // Heartbeat succeeded, meaning we are definitely online
      if (typeof window !== "undefined") {
        (window as any).forceOfflineMode = false;
        if (this.status === "offline") {
          this.setStatus("online");
          window.dispatchEvent(new Event("supabase_online"));
        }
      }
    } catch (error) {
      this.heartbeatFailures++;
      this.emit({
        type: "heartbeat_failed",
        timestamp: Date.now(),
        data: { failures: this.heartbeatFailures },
      });

      // إذا فشل Heartbeat مرتين متتاليتين، اعتبر الاتصال منقطعاً
      if (this.heartbeatFailures >= this.maxHeartbeatFailures) {
        this.setStatus("offline");
      }
    }
  }

  /**
   * معالج حدث الاتصال
   */
  private handleOnline() {
    if (this.status === "offline") {
      this.setStatus("online");
      this.heartbeatFailures = 0;
      this.emit({
        type: "connection_restored",
        timestamp: Date.now(),
      });
    }
  }

  /**
   * معالج حدث الانقطاع
   */
  private handleOffline() {
    this.setStatus("offline");
  }

  /**
   * تعيين حالة الأوفلاين
   */
  private setStatus(newStatus: OfflineStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit({
        type: "status_changed",
        timestamp: Date.now(),
        data: { status: newStatus },
      });
    }
  }

  /**
   * إصدار حدث للمستمعين
   */
  private emit(event: OfflineEvent) {
    // أيضاً أرسل الحدث عبر window events للتوافق مع الكود القديم
    window.dispatchEvent(
      new CustomEvent(event.type, {
        detail: event.data,
      })
    );

    // أخبر جميع المستمعين المسجلين
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in offline state listener:", error);
      }
    });
  }

  /**
   * تسجيل مستمع للأحداث
   */
  public subscribe(listener: OfflineStateListener): () => void {
    this.listeners.add(listener);

    // إرجاع دالة إلغاء الاشتراك
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * الحصول على الحالة الحالية
   */
  public getStatus(): OfflineStatus {
    return this.status;
  }

  /**
   * التحقق من الاتصال الحالي
   */
  public isOnline(): boolean {
    return this.status === "online" && navigator.onLine;
  }

  /**
   * التحقق من حالة المزامنة
   */
  public isSyncingNow(): boolean {
    return this.isSyncing;
  }

  /**
   * تحديث حالة المزامنة
   */
  public setSyncingStatus(syncing: boolean) {
    this.isSyncing = syncing;
    this.setStatus(syncing ? "syncing" : "online");
  }

  /**
   * إضافة عملية إلى طابور الأوفلاين
   */
  public addToQueue(request: any) {
    this.pendingQueue.push({
      ...request,
      id: request.id || crypto.randomUUID(),
      timestamp: Date.now(),
    });
    this.saveQueueToStorage();
    this.emit({
      type: "queue_updated",
      timestamp: Date.now(),
      data: { queueLength: this.pendingQueue.length },
    });
  }

  /**
   * الحصول على طابور العمليات
   */
  public getQueue(): any[] {
    return [...this.pendingQueue];
  }

  /**
   * الحصول على عدد العمليات المعلقة
   */
  public getPendingCount(): number {
    return this.pendingQueue.length;
  }

  /**
   * إزالة عملية من الطابور
   */
  public removeFromQueue(index: number) {
    if (index >= 0 && index < this.pendingQueue.length) {
      this.pendingQueue.splice(index, 1);
      this.saveQueueToStorage();
      this.emit({
        type: "queue_updated",
        timestamp: Date.now(),
        data: { queueLength: this.pendingQueue.length },
      });
    }
  }

  /**
   * مسح الطابور بالكامل
   */
  public clearQueue() {
    this.pendingQueue = [];
    this.saveQueueToStorage();
    this.emit({
      type: "queue_updated",
      timestamp: Date.now(),
      data: { queueLength: 0 },
    });
  }

  /**
   * حفظ الطابور في localStorage
   */
  private saveQueueToStorage() {
    try {
      localStorage.setItem(
        "supabase_offline_queue",
        JSON.stringify(this.pendingQueue)
      );
    } catch (error) {
      console.error("Failed to save queue to storage:", error);
    }
  }

  /**
   * تحميل الطابور من localStorage
   */
  private loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem("supabase_offline_queue");
      if (stored) {
        this.pendingQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load queue from storage:", error);
      this.pendingQueue = [];
    }
  }

  /**
   * تنظيف الموارد
   */
  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.listeners.clear();
  }
}

// إنشاء instance واحد فقط (Singleton)
let instance: OfflineStateManager | null = null;

export function getOfflineStateManager(): OfflineStateManager {
  if (!instance && typeof window !== "undefined") {
    instance = new OfflineStateManager();
  }
  return instance!;
}

export type { OfflineStatus, OfflineEvent, EventType };
