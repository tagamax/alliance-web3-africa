import { useEffect, useState } from 'react';
import { Download, Share2, RefreshCw, Copy, Check } from 'lucide-react';
import { generateQRCodeSVG, downloadQRCode, shareQRCode, getCachedQR, cacheQR } from '../lib/qrSystem';

interface QRCodeProps {
  data: string;
  size?: number;
  showActions?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  label?: string;
  className?: string;
}

export default function QRCode({
  data,
  size = 256,
  showActions = true,
  autoRefresh = false,
  refreshInterval = 60000,
  label,
  className = '',
}: QRCodeProps) {
  const [svg, setSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQR();

    if (autoRefresh) {
      const interval = setInterval(generateQR, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [data, size, autoRefresh, refreshInterval]);

  const generateQR = () => {
    const cacheKey = `${data}_${size}`;
    const cached = getCachedQR(cacheKey);

    if (cached) {
      setSvg(cached);
      return;
    }

    const newSvg = generateQRCodeSVG(data, size);
    setSvg(newSvg);
    cacheQR(cacheKey, newSvg);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadQRCode(svg, label || 'qrcode');
  };

  const handleShare = async () => {
    try {
      await shareQRCode(svg, label || 'QR Code');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className={`qr-code-container ${className}`}>
      {label && (
        <div className="mb-3 text-center">
          <p className="text-sm font-semibold text-gray-300">{label}</p>
        </div>
      )}

      <div className="qr-code-display bg-white p-4 rounded-xl inline-block mx-auto">
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="qr-code-svg"
        />
      </div>

      {showActions && (
        <div className="qr-actions mt-4 flex gap-2 justify-center flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded-lg transition-all"
            title="Copier"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copié!' : 'Copier'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded-lg transition-all"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded-lg transition-all"
              title="Partager"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
          )}

          {autoRefresh && (
            <button
              onClick={generateQR}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600/50 hover:bg-emerald-500/50 text-white text-sm rounded-lg transition-all"
              title="Régénérer"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}
