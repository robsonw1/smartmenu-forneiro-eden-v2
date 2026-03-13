import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';
import { Gift, Star, Sparkles, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

interface PostCheckoutLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  pointsEarned?: number;
}

export function PostCheckoutLoyaltyModal({
  isOpen,
  onClose,
  email,
  pointsEarned = 0,
}: PostCheckoutLoyaltyModalProps) {
  const [step, setStep] = useState<'auth' | 'form'>('auth');
  const [currentEmail, setCurrentEmail] = useState('');
  const [keepConnected, setKeepConnected] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const registerCustomer = useLoyaltyStore((s) => s.registerCustomer);
  const currentCustomer = useLoyaltyStore((s) => s.currentCustomer);
  const isRemembered = useLoyaltyStore((s) => s.isRemembered);

  const handleClose = () => {
    if (!isRemembered) {
      setStep('auth');
      setCurrentEmail('');
      setFormData({ name: '', cpf: '' });
      setKeepConnected(false);
    }
    onClose();
  };

  const handleRegister = async () => {
    if (!formData.name.trim()) {
      toast.error('Informe seu nome');
      return;
    }

    if (!formData.cpf.trim()) {
      toast.error('Informe o CPF');
      return;
    }

    if (!currentEmail.trim() || !currentEmail.includes('@')) {
      toast.error('Informe um email válido');
      return;
    }

    setIsLoading(true);
    try {
      const success = await registerCustomer(
        currentEmail,
        formData.cpf.replace(/\D/g, ''),
        formData.name
      );

      if (success) {
        toast.success('✅ Acesso realizado! Você ganhou 50 pontos!');
        setCurrentEmail('');
        setFormData({ name: '', cpf: '' });
        setKeepConnected(false);
        onClose();
      } else {
        toast.error('Erro ao processar. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* TELA DE SUCESSO - Cliente logado com rememberMe */}
        {isRemembered && currentCustomer ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <DialogTitle>Parabéns!</DialogTitle>
              </div>
              <DialogDescription className="text-center pt-2">
                Pontos adicionados com sucesso
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Seus pontos</p>
                <p className="text-5xl font-bold text-primary">{pointsEarned}+</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Seu saldo atual</p>
                    <p className="text-lg font-bold">{currentCustomer.totalPoints} pontos</p>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                    <p className="font-semibold text-sm">R$ {currentCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Compras</p>
                    <p className="font-semibold text-sm">{currentCustomer.totalPurchases}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-xs text-muted-foreground">
                <p>💡 Você está com login ativo! Continue acumulando pontos em cada compra e desbloqueie descontos exclusivos.</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Continuar Comprando
              </Button>
            </DialogFooter>
          </>
        ) : step === 'auth' ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Gift className="w-8 h-8 text-primary" />
                <DialogTitle>Minha Conta</DialogTitle>
              </div>
              <DialogDescription className="text-center pt-2">
                Acesse sua conta ou crie uma nova e GANHE cashback a cada compra!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Benefícios compactos */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">50 Pontos de Bônus</p>
                    <p className="text-xs text-muted-foreground">
                      R$ 2,50 em desconto na sua próxima compra
                    </p>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">1% de Pontos</p>
                    <p className="text-xs text-muted-foreground">
                      Ganhe em cada compra (100 pontos = R$ 5)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-semibold text-foreground">Use o mesmo email e CPF</span> que utilizou no cadastro.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                Agora Não
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                Entrar / Cadastrar
              </Button>
            </DialogFooter>
          </>
        ) : step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Minha Conta</DialogTitle>
              <DialogDescription>
                Acesse sua conta ou crie uma nova
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    if (value.length <= 3) {
                      setFormData({ ...formData, cpf: value });
                    } else if (value.length <= 6) {
                      setFormData({
                        ...formData,
                        cpf: `${value.slice(0, 3)}.${value.slice(3)}`,
                      });
                    } else if (value.length <= 9) {
                      setFormData({
                        ...formData,
                        cpf: `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        cpf: `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`,
                      });
                    }
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-secondary">
                <Checkbox
                  id="keep-connected"
                  checked={keepConnected}
                  onCheckedChange={(checked) => setKeepConnected(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="keep-connected" className="text-sm cursor-pointer flex-1">
                  Me manter conectado
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-muted-foreground">
                  🔒 <span className="font-semibold text-foreground">Use o mesmo email e CPF</span> que utilizou no cadastro.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('auth')} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleRegister} className="flex-1" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
