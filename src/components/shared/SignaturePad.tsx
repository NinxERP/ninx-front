import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";

export interface SignaturePadHandle {
  toDataUrl: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  initialDataUrl?: string;
}

const HISTORY_LIMIT = 50;

function limparCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1a1a1a";
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { initialDataUrl },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhandoRef = useRef(false);
  const temTracoRef = useRef(false);
  const historicoRef = useRef<ImageData[]>([]);

  useImperativeHandle(ref, () => ({
    toDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? null,
    isEmpty: () => !temTracoRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    limparCanvas(ctx, canvas);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        temTracoRef.current = true;
      };
      img.src = initialDataUrl;
    }

    const posicaoRelativa = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      historicoRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (historicoRef.current.length > HISTORY_LIMIT) historicoRef.current.shift();
      canvas.setPointerCapture(e.pointerId);
      desenhandoRef.current = true;
      const p = posicaoRelativa(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!desenhandoRef.current) return;
      const p = posicaoRelativa(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      temTracoRef.current = true;
      e.preventDefault();
    };

    const finalizarTraco = (e: PointerEvent) => {
      if (!desenhandoRef.current) return;
      desenhandoRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // já liberado
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", finalizarTraco);
    canvas.addEventListener("pointercancel", finalizarTraco);
    canvas.addEventListener("pointerleave", finalizarTraco);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finalizarTraco);
      canvas.removeEventListener("pointercancel", finalizarTraco);
      canvas.removeEventListener("pointerleave", finalizarTraco);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    limparCanvas(ctx, canvas);
    temTracoRef.current = false;
    historicoRef.current = [];
  };

  const desfazer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const anterior = historicoRef.current.pop();
    if (!anterior) return;
    ctx.putImageData(anterior, 0, 0);
    temTracoRef.current = historicoRef.current.length > 0;
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} className="h-40 w-full touch-none rounded-md border bg-white" />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={desfazer}>
          Desfazer
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={limpar}>
          Limpar
        </Button>
      </div>
    </div>
  );
});
