import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Activity, Newspaper, ArrowUpRight, AlertCircle, Award, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'activity' | 'news' | 'transaction' | 'alert' | 'achievement';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}


export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.data?.action) {
      navigate(notification.data.action);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Activity className="h-5 w-5 text-blue-400" />;
      case 'news':
        return <Newspaper className="h-5 w-5 text-amber-400" />;
      case 'transaction':
        return <ArrowUpRight className="h-5 w-5 text-emerald-400" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-purple-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'activity':
        return 'from-blue-500/10 to-blue-600/10 border-blue-500/20';
      case 'news':
        return 'from-amber-500/10 to-amber-600/10 border-amber-500/20';
      case 'transaction':
        return 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20';
      case 'alert':
        return 'from-red-500/10 to-red-600/10 border-red-500/20';
      case 'achievement':
        return 'from-purple-500/10 to-purple-600/10 border-purple-500/20';
      default:
        return 'from-gray-500/10 to-gray-600/10 border-gray-500/20';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Restez informé de toutes vos activités</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-all"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-amber-500 text-black'
              : 'bg-slate-800/50 text-gray-400 hover:text-white'
          }`}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'unread'
              ? 'bg-amber-500 text-black'
              : 'bg-slate-800/50 text-gray-400 hover:text-white'
          }`}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-black bg-opacity-40 backdrop-blur-lg rounded-xl border border-amber-500/20">
            <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-gradient-to-br ${getNotificationColor(notification.type)} backdrop-blur-sm rounded-xl p-5 border transition-all ${
                notification.read ? 'opacity-60' : 'hover:scale-[1.01] cursor-pointer'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${notification.read ? 'bg-slate-800/50' : 'bg-slate-800'}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`font-semibold ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(notification.created_at)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-300'}`}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Marquer comme lu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
