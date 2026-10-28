import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Notification as AppNotification } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initialDemoData';
import { useAuth } from './AuthContext';
import {
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../services/notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  browserPermission: NotificationPermission;
  requestPermission: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Sync notifications for the current user
  const userNotifications = notifications.filter(
    (n) => !currentUser || n.user_id === currentUser.id
  );
  const unreadCount = userNotifications.filter((n) => !n.read_at).length;

  const requestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
    }
  };

  const markAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (!currentUser || n.user_id === currentUser.id ? { ...n, read_at: now } : n))
    );

    if (isSupabaseConfigured && supabase && currentUser) {
      supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', currentUser.id)
        .is('read_at', null);
    }
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'created_at'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Send browser notification if user is in background tab
    sendBrowserNotification(notif.title, {
      body: notif.message,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        unreadCount,
        browserPermission,
        requestPermission,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
