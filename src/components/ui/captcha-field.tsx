import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onValidChange: (valid: boolean) => void;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const LENGTH = 5;
const WIDTH = 220;
const HEIGHT = 74;

const generateCode = () => {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
};

const randomPastel = (alpha = 0.55) => {
  const hue = Math.floor(Math.random() * 360);
  const sat = 40 + Math.random() * 30;
  const light = 65 + Math.random() * 20;
  return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
};

const drawCaptcha = (canvas: HTMLCanvasElement, code: string) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    const rx = 8 + Math.random() * 18;
    const ry = 8 + Math.random() * 18;
    const cx = Math.random() * WIDTH;
    const cy = Math.random() * HEIGHT;
    ctx.fillStyle = randomPastel();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.strokeStyle = randomPastel(0.5);
    ctx.lineWidth = 1;
    ctx.moveTo(Math.random() * WIDTH, Math.random() * HEIGHT);
    ctx.lineTo(Math.random() * WIDTH, Math.random() * HEIGHT);
    ctx.stroke();
  }

  const gap = WIDTH / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const x = gap * (i + 1) + (Math.random() * 6 - 3);
    const y = HEIGHT / 2 + (Math.random() * 14 - 7);
    const size = 26 + Math.random() * 10;
    const angle = (Math.random() * 36 - 18) * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = `rgba(${30 + Math.random() * 40}, ${30 + Math.random() * 40}, ${30 + Math.random() * 40}, 0.85)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
};

const CaptchaField = ({ value, onChange, onValidChange }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState('');

  const refresh = () => {
    const next = generateCode();
    setCode(next);
    onChange('');
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (canvasRef.current && code) {
      drawCaptcha(canvasRef.current, code);
    }
  }, [code]);

  useEffect(() => {
    onValidChange(value.trim().toLowerCase() === code.toLowerCase() && value.trim().length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, code]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Мы должны знать, что Вы не робот.</p>

      <div className="flex items-center gap-4">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="rounded-md border border-border"
        />
        <button
          type="button"
          onClick={refresh}
          className="shrink-0 text-sm font-bold uppercase tracking-wide text-foreground hover:text-accent"
        >
          Обновить
        </button>
      </div>

      <div className="relative">
        <label className="absolute -top-2 left-4 bg-background px-1.5 text-xs text-muted-foreground">
          Введите код с картинки
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Введите код с картинки"
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
};

export default CaptchaField;
