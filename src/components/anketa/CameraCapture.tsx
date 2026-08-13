import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Props {
  label: string;
  hint: string;
  preview: string | null;
  onCapture: (file: File) => void;
  aspect?: 'square' | 'wide';
}

const CameraCapture = ({ label, hint, preview, onCapture, aspect = 'wide' }: Props) => {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError('Не удалось получить доступ к камере. Разрешите доступ к камере в браузере.');
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
    }, 'image/jpeg', 0.92);
  };

  const cancel = () => {
    stopStream();
    setActive(false);
  };

  useEffect(() => () => stopStream(), []);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-primary">{label}</p>

      {active ? (
        <div className="overflow-hidden rounded-xl border-2 border-accent bg-black">
          <div className={aspect === 'square' ? 'aspect-square' : 'aspect-[4/3]'}>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-2 bg-background p-3">
            <Button type="button" variant="outline" className="flex-1" onClick={cancel}>
              Отмена
            </Button>
            <Button type="button" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={takeShot}>
              <Icon name="Camera" size={16} className="mr-1.5" /> Сделать снимок
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/50 p-8 text-center transition-colors hover:border-accent hover:bg-accent/5"
        >
          {preview ? (
            <>
              <img src={preview} alt={label} className="max-h-44 rounded-lg object-contain shadow-md" />
              <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
                <Icon name="RefreshCw" size={15} /> Переснять фото
              </span>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                <Icon name="Camera" size={26} />
              </div>
              <div>
                <p className="font-medium text-primary">Сделать фото через камеру</p>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
            </>
          )}
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
