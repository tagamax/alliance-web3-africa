import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    const result = await api.notifications.getAll(user.id);

    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.data.filter((n: Notification) => !n.is_read).length);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    if (user) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: '/logo-192.png',
              });
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await api.notifications.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await api.notifications.markAllAsRead(user.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications,
    requestPermission,
  };
}
