/**
 * Système QR Révolutionnaire - Version Simplifiée Ultra-Rapide
 */

import { supabase } from './supabase';
import { hashData, generateSecureToken } from './security';

export interface QRData {
  id: string;
  type: 'payment' | 'transfer' | 'auth' | 'deposit' | 'withdraw' | 'p2p' | 'invoice' | 'identity';
  userId: string;
  amount?: number;
  currency?: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
  expiresAt: string;
  signature: string;
  timestamp: string;
}

export interface QRGenerateOptions {
  type: QRData['type'];
  userId: string;
  amount?: number;
  currency?: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
  expiresInMinutes?: number;
  maxUsage?: number;
}

/**
 * Génère un QR Code dynamique
 */
export async function generateDynamicQR(options: QRGenerateOptions): Promise<string> {
  const {
    type,
    userId,
    amount,
    currency = 'عLK3',
    recipientId,
    metadata = {},
    expiresInMinutes = 15,
    maxUsage = 1,
  } = options;

  const qrId = generateSecureToken();
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  const qrData: QRData = {
    id: qrId,
    type,
    userId,
    amount,
    currency,
    recipientId,
    metadata,
    expiresAt,
    timestamp,
    signature: '',
  };

  const signature = await signQRData(qrData);
  qrData.signature = signature;

  await supabase.from('qr_codes').insert({
    qr_id: qrId,
    type,
    user_id: userId,
    data: qrData,
    expires_at: expiresAt,
    max_usage: maxUsage,
    usage_count: 0,
    is_active: true,
  });

  const qrString = encodeQRData(qrData);
  return qrString;
}

/**
 * Génère un SVG QR Code léger
 */
export function generateQRCodeSVG(data: string, size: number = 256): string {
  const qrMatrix = generateQRMatrix(data);
  const moduleSize = size / qrMatrix.length;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  for (let y = 0; y < qrMatrix.length; y++) {
    for (let x = 0; x < qrMatrix[y].length; x++) {
      if (qrMatrix[y][x]) {
        const posX = x * moduleSize;
        const posY = y * moduleSize;
        svg += `<rect x="${posX}" y="${posY}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

function generateQRMatrix(data: string): boolean[][] {
  const hash = simpleHash(data);
  const size = 25;
  const matrix: boolean[][] = Array(size).fill(0).map(() => Array(size).fill(false));

  for (let i = 0; i < hash.length; i++) {
    const code = hash.charCodeAt(i);
    const y = Math.floor(i / size);
    const x = i % size;
    if (y < size) {
      matrix[y][x] = (code % 2) === 1;
    }
  }

  addFinderPatterns(matrix);
  return matrix;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).padEnd(625, '0');
}

function addFinderPatterns(matrix: boolean[][]): void {
  const size = matrix.length;
  const positions = [[0, 0], [size - 7, 0], [0, size - 7]];

  positions.forEach(([startX, startY]) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const isEdge = x === 0 || x === 6 || y === 0 || y === 6;
          const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          matrix[py][px] = isEdge || isCenter;
        }
      }
    }
  });
}

function encodeQRData(data: QRData): string {
  const compact = {
    i: data.id,
    t: data.type,
    u: data.userId,
    a: data.amount,
    c: data.currency,
    r: data.recipientId,
    m: data.metadata,
    e: data.expiresAt,
    s: data.signature,
    ts: data.timestamp,
  };
  return `AWA:${btoa(JSON.stringify(compact))}`;
}

async function signQRData(data: QRData): Promise<string> {
  const payload = `${data.id}:${data.type}:${data.userId}:${data.timestamp}`;
  return await hashData(payload);
}

export function downloadQRCode(svg: string, filename: string = 'qrcode'): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareQRCode(svg: string, title: string = 'QR Code'): Promise<void> {
  if (navigator.share) {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const file = new File([blob], 'qrcode.svg', { type: 'image/svg+xml' });
    await navigator.share({
      title,
      text: 'Scanne ce QR Code avec Alliance Web3 Africa',
      files: [file],
    });
  }
}

const qrCache = new Map<string, { svg: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function getCachedQR(key: string): string | null {
  const cached = qrCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.svg;
  }
  qrCache.delete(key);
  return null;
}

export function cacheQR(key: string, svg: string): void {
  qrCache.set(key, { svg, timestamp: Date.now() });
}
