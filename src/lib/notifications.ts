import { supabase } from './supabase';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'database';

export interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  data?: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    channels = ['database'],
    data,
  } = params;

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        channels,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Notification error:', error);

    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
    });

    return { success: false, error };
  }
}

export async function sendDepositNotification(userId: string, amount: number, method: string) {
  return sendNotification({
    userId,
    type: 'deposit',
    title: 'Dépôt Initié',
    message: `Votre dépôt de ${amount} عLK3 via ${method} est en cours de traitement.`,
    channels: ['database', 'email'],
    data: {
      amount,
      method,
      action: '/notifications',
    },
  });
}

export async function sendWithdrawNotification(userId: string, amount: number, method: string) {
  return sendNotification({
    userId,
    type: 'withdraw',
    title: 'Retrait Initié',
    message: `Votre retrait de ${amount} عLK3 via ${method} est en cours de traitement.`,
    channels: ['database', 'email'],
    data: {
      amount,
      method,
      action: '/notifications',
    },
  });
}

export async function sendTransactionNotification(
  userId: string,
  type: 'success' | 'failed',
  transactionType: string,
  amount: number
) {
  const title = type === 'success' ? 'Transaction Réussie' : 'Transaction Échouée';
  const message = type === 'success'
    ? `Votre ${transactionType} de ${amount} عLK3 a été effectué avec succès.`
    : `Votre ${transactionType} de ${amount} عLK3 a échoué.`;

  return sendNotification({
    userId,
    type: `transaction_${type}`,
    title,
    message,
    channels: ['database', 'email', 'push'],
    data: {
      amount,
      transactionType,
      action: '/notifications',
    },
  });
}

export async function sendWelcomeNotification(userId: string, userName: string) {
  return sendNotification({
    userId,
    type: 'welcome',
    title: 'Bienvenue sur Alliance Web3 Africa!',
    message: `Bonjour ${userName}! Votre compte a été créé avec succès. Explorez nos services Web3.`,
    channels: ['database', 'email'],
    data: {
      action: '/dashboard',
    },
  });
}
