import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import logoForneiro from '@/assets/logo-forneiro.jpg';

export default function ClientOnboardingSuccess() {
  const navigate = useNavigate();
  const [successData, setSuccessData] = useState<{
    tenantId: string;
    tenantName: string;
    appUrl: string;
    adminEmail: string;
  } | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('onboarding-success');
    if (!data) {
      navigate('/');
      return;
    }
    setSuccessData(JSON.parse(data));
  }, [navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  if (!successData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl">Parabéns! 🎉</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Seu app SmartMenu foi criado com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          <div className="space-y-6">
            {/* App URL */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>🌐 Seu App Está Online!</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Acesse seu aplicativo em:
              </p>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-lg border">
                <input
                  type="text"
                  value={successData.appUrl}
                  readOnly
                  className="flex-1 bg-transparent border-0 outline-none"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(successData.appUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button asChild className="w-full mt-3" size="lg">
                <a href={successData.appUrl} target="_blank" rel="noopener noreferrer">
                  Abrir Seu App →
                </a>
              </Button>
            </div>

            {/* Credenciais */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>Email de Confirmação</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Um email foi enviado para <strong>{successData.adminEmail}</strong> com suas credenciais de acesso.
              </p>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-mono font-semibold">{successData.adminEmail}</p>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Verifique sua caixa de entrada e a pasta de SPAM
                </div>
              </div>
            </div>

            {/* Informações Criadas */}
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-lg">📦 Seu Setup Inclui:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Cardápio Inicial:</strong> 4 pizzas de exemplo (você customize depois)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Horários:</strong> Configurados conforme você informou
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Áreas de Entrega:</strong> Bairros com taxas configuradas
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Painel Administrativo:</strong> Controle total do seu app
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Sistema de Pedidos:</strong> Em tempo real com notificações
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  <span>
                    <strong>Programa de Fidelização:</strong> Pontos e cashback para clientes
                  </span>
                </li>
              </ul>
            </div>

            {/* Próximos Passos */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">🚀 Próximos Passos:</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Acesse seu painel admin (link no email)</li>
                <li>Customize seu cardápio completo</li>
                <li>Configure suas integrações (WhatsApp, Mercado Pago, etc)</li>
                <li>Teste o fluxo de um pedido</li>
                <li>Compartilhe o link com seus clientes! 🎊</li>
              </ol>
            </div>

            {/* FAQ */}
            <div className="border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">❓ Dúvidas?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Verifique a documentação no painel admin ou entre em contato conosco através do email.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <a href="https://smartmenu.io/help" target="_blank" rel="noopener noreferrer">
                    Central de Ajuda
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href="mailto:support@smartmenu.io">
                    Contatar Suporte
                  </a>
                </Button>
              </div>
            </div>

            {/* CTA Final */}
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <a href="/">Voltar para Início</a>
              </Button>
              <Button asChild className="flex-1">
                <a href={successData.appUrl} target="_blank" rel="noopener noreferrer">
                  Acessar Meu App →
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
