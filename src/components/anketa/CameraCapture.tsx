import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Props {
  label: string;
  hint: string;
  preview: string | null;
  onCapture: (file: File) => void;
  aspect?: 'square' | 'wide';
  checking?: boolean;
  checked?: boolean;
  secondsLeft?: number;
  totalSeconds?: number;
}

const CameraCapture = ({
  label, hint, preview, onCapture, aspect = 'wide',
  checking = false, checked = false, secondsLeft = 0, totalSeconds = 40,
}: Props) => {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [expanded, setExpanded] = useState(false);
  const [switching, setSwitching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const openStream = async (mode: 'environment' | 'user') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: mode } },
      audio: false,
    });
    streamRef.current = stream;
    return stream;
  };

  const attach = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await openStream(facing);
      setActive(true);
      requestAnimationFrame(() => attach(stream));
    } catch {
      setError('Не удалось получить доступ к камере. Разрешите доступ к камере в браузере.');
    }
  };

  const switchCamera = async () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setSwitching(true);
    stopStream();
    try {
      const stream = await openStream(next);
      setFacing(next);
      attach(stream);
    } catch {
      try {
        const stream = await openStream(facing);
        attach(stream);
      } catch {
        setError('Не удалось переключить камеру');
      }
    } finally {
      setSwitching(false);
    }
  };

  const takeShot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      stopStream();
      setActive(false);
      setExpanded(false);
    }, 'image/jpeg', 0.92);
  };

  const cancel = () => {
    stopStream();
    setActive(false);
    setExpanded(false);
  };

  useEffect(() => () => stopStream(), []);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-primary">{label}</p>

      <Dialog open={active} onOpenChange={(open) => { if (!open) cancel(); }}>
        <DialogContent className={`flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-black p-0 ${expanded ? 'sm:h-[100dvh] sm:w-screen sm:max-w-none sm:rounded-none' : 'sm:h-[92vh] sm:w-[95vw] sm:max-w-2xl sm:rounded-2xl'}`}>
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <div className="relative flex-1 overflow-hidden bg-black">
            <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />
            <div className="absolute left-3 top-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={switchCamera}
                disabled={switching}
                className="flex h-11 items-center gap-1.5 rounded-full bg-black/60 px-4 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/80 disabled:opacity-50"
              >
                <Icon name="SwitchCamera" size={18} className={switching ? 'animate-spin' : ''} />
                {facing === 'environment' ? 'Фронтальная' : 'Основная'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="absolute right-3 top-3 z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80 sm:flex"
              aria-label={expanded ? 'Свернуть камеру' : 'Развернуть камеру'}
            >
              <Icon name={expanded ? 'Minimize2' : 'Maximize2'} size={18} />
            </button>
          </div>
          <div className="flex gap-2 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" className="h-12 flex-1" onClick={cancel}>
              Отмена
            </Button>
            <Button type="button" className="h-12 flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={takeShot}>
              <Icon name="Camera" size={18} className="mr-1.5" /> Сделать снимок
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {preview ? (
        <div className={`overflow-hidden rounded-xl border-2 transition-colors ${
          checking ? 'border-blue-300' : checked ? 'border-green-400' : 'border-border'
        }`}>
          <div className="relative bg-black">
            <img src={preview} alt={label} className={`mx-auto max-h-56 w-full object-contain transition-opacity ${checking ? 'opacity-60' : 'opacity-100'}`} />

            {checking && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-scan-line absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-blue-400/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25">
                  <Icon name="Loader2" size={30} className="animate-spin text-white drop-shadow" />
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    Проверяем фото... {secondsLeft} сек.
                  </span>
                </div>
              </div>
            )}

            {checked && !checking && (
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg">
                <Icon name="Check" size={18} className="text-white" />
              </div>
            )}
          </div>

          {checking && (
            <div className="h-1 w-full bg-blue-100">
              <div
                className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                style={{ width: `${Math.max(0, 100 - (secondsLeft / totalSeconds) * 100)}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 bg-background p-3">
            {checking ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600">
                <Icon name="ShieldCheck" size={15} className="shrink-0" /> Идёт проверка, подождите...
              </span>
            ) : checked ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <Icon name="CheckCircle2" size={15} className="shrink-0" /> Фото проверено
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Фото загружено</span>
            )}
            <button
              type="button"
              onClick={startCamera}
              disabled={checking}
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="RefreshCw" size={14} /> Переснять
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-accent hover:bg-accent/5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <Icon name="Camera" size={26} />
          </div>
          <div>
            <p className="font-medium text-primary">Сделать фото через камеру</p>
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
        </button>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <Icon name="AlertTriangle" size={14} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

export default CameraCapture;