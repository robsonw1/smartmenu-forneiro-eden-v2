import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  size?: 100 | 200 | 300 | 500 | 1000;
  showControls?: boolean;
  label?: string;
}

export function QRCodeDisplay({ size = 200, showControls = true, label }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const downloadQR = (format: 'png' | 'svg') => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    
    if (!canvas) {
      toast.error('Não foi possível gerar o QR Code');
      return;
    }

    if (format === 'png') {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-forneiro-${size}x${size}.png`;
      link.click();
      toast.success('QR Code PNG baixado!');
    } else if (format === 'svg') {
      // Gerar SVG do QR Code
      const svgElement = qrRef.current?.querySelector('svg') as SVGElement | null;
      if (!svgElement) {
        toast.error('Não foi possível gerar SVG');
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-forneiro-${size}x${size}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('QR Code SVG baixado! ✨ Melhor para imprimir');
    }
  };

  if (showControls) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code do App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="flex justify-center p-8 bg-secondary rounded-lg">
              <div ref={qrRef}>
                <QRCode
                  value={appUrl}
                  size={size}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            {/* URL Info */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">URL do App:</p>
              <p className="text-sm font-mono break-all text-foreground">{appUrl}</p>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Baixar QR Code ({size}x{size}px):</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => downloadQR('png')}
                  variant="default"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </Button>
                <Button
                  onClick={() => downloadQR('svg')}
                  variant="secondary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  SVG ✨
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 SVG é melhor para imprimir - redimensiona sem perder qualidade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo simples (sem controles)
  return (
    <div ref={qrRef}>
      <QRCode
        value={appUrl}
        size={size}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
