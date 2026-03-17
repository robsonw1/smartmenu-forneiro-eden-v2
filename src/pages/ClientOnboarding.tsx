import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ChevronRight } from 'lucide-react';
import logoForneiro from '@/assets/logo-forneiro.jpg';

const onboardingSchema = z.object({
  establishment_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  admin_email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  schedule: z.object({
    monday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    tuesday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    wednesday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    thursday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    friday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    saturday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
    sunday: z.object({ isOpen: z.boolean(), openTime: z.string(), closeTime: z.string() }),
  }),
  neighborhoods: z.array(
    z.object({
      name: z.string().min(3, 'Nome do bairro obrigatório'),
      deliveryFee: z.coerce.number().min(0, 'Taxa de entrega deve ser >= 0'),
    })
  ),
  slogan: z.string().max(100, 'Máximo 100 caracteres').optional(),
  address: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const defaultSchedule = {
  monday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  thursday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  friday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
  saturday: { isOpen: true, openTime: '17:00', closeTime: '00:30' },
  sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const daysLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    control,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      establishment_name: '',
      admin_email: '',
      phone: '',
      schedule: defaultSchedule,
      neighborhoods: [{ name: 'Centro', deliveryFee: 5 }],
      slogan: '',
      address: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'neighborhoods',
  });

  const schedule = watch('schedule');

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    try {
      // Chamar Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-tenant-onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            establishment_name: data.establishment_name,
            admin_email: data.admin_email,
            phone: data.phone,
            schedule: data.schedule,
            neighborhoods: data.neighborhoods,
            slogan: data.slogan,
            address: data.address,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar tenant');
      }

      // Armazenar dados temporários para a página de sucesso
      sessionStorage.setItem(
        'onboarding-success',
        JSON.stringify({
          tenantId: result.tenant_id,
          tenantName: data.establishment_name,
          appUrl: result.app_url,
          adminEmail: data.admin_email,
        })
      );

      toast.success('Tenant criado com sucesso!');
      navigate('/onboarding/success');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <img src={logoForneiro} alt="SmartMenu" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
          <CardTitle className="font-display text-2xl">Crie Seu App SmartMenu</CardTitle>
          <CardDescription>Configure seu estabelecimento em 4 passo fáceis</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={`step-${currentStep}`} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="step-1" disabled={false}>
                Básico
              </TabsTrigger>
              <TabsTrigger value="step-2" disabled={currentStep < 2}>
                Horários
              </TabsTrigger>
              <TabsTrigger value="step-3" disabled={currentStep < 3}>
                Bairros
              </TabsTrigger>
              <TabsTrigger value="step-4" disabled={currentStep < 4}>
                Resumo
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Passo 1: Dados Básicos */}
              <TabsContent value="step-1" className="space-y-4">
                <div>
                  <Label htmlFor="establishment_name">Nome do Estabelecimento</Label>
                  <Input
                    id="establishment_name"
                    placeholder="Ex: Pizzaria do João"
                    {...register('establishment_name')}
                  />
                  {errors.establishment_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.establishment_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="admin_email">Email do Admin</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder="admin@pizzaria.com"
                    {...register('admin_email')}
                  />
                  {errors.admin_email && (
                    <p className="text-sm text-red-500 mt-1">{errors.admin_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <Label htmlFor="slogan">Slogan (opcional)</Label>
                  <Input
                    id="slogan"
                    placeholder="Ex: A melhor pizza da região!"
                    {...register('slogan')}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço (opcional)</Label>
                  <Input
                    id="address"
                    placeholder="Ex: Rua das Flores, 123"
                    {...register('address')}
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!watch('establishment_name') || !watch('admin_email') || !watch('phone')}
                  className="w-full"
                >
                  Próximo <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </TabsContent>

              {/* Passo 2: Horários */}
              <TabsContent value="step-2" className="space-y-6">
                {daysOfWeek.map((day, idx) => (
                  <div key={day} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{daysLabels[idx]}</Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register(`schedule.${day}.isOpen`)} />
                        <span className="text-sm">Aberto</span>
                      </label>
                    </div>

                    {schedule?.[day]?.isOpen && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Abre</Label>
                          <Input type="time" {...register(`schedule.${day}.openTime`)} />
                        </div>
                        <div>
                          <Label className="text-xs">Fecha</Label>
                          <Input type="time" {...register(`schedule.${day}.closeTime`)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(3)} className="flex-1">
                    Próximo <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* Passo 3: Bairros */}
              <TabsContent value="step-3" className="space-y-4">
                {fields.map((field, idx) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Bairro {idx + 1}</h4>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                          Remover
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Nome do Bairro</Label>
                      <Input {...register(`neighborhoods.${idx}.name`)} placeholder="Ex: Centro" />
                      {errors.neighborhoods?.[idx]?.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.neighborhoods[idx]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Taxa de Entrega (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`neighborhoods.${idx}.deliveryFee`)}
                        placeholder="5.00"
                      />
                      {errors.neighborhoods?.[idx]?.deliveryFee && (
                        <p className="text-sm text-red-500 mt-1">{errors.neighborhoods[idx]?.deliveryFee?.message}</p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '', deliveryFee: 5 })}
                  className="w-full"
                >
                  + Adicionar Bairro
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(4)} className="flex-1">
                    Próximo <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* Passo 4: Resumo */}
              <TabsContent value="step-4" className="space-y-6">
                <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-lg">Resumo das Informações</h3>

                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Estabelecimento</p>
                      <p className="font-semibold">{watch('establishment_name')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email do Admin</p>
                      <p className="font-semibold">{watch('admin_email')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-semibold">{watch('phone')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bairros Configurados</p>
                      <p className="font-semibold">{fields.length} bairro(s)</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-400 mb-2">✅ Seu app incluirá:</p>
                    <ul className="text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li>Cardápio inicial com 4 pizzas de exemplo</li>
                      <li>Horários de funcionamento configurados</li>
                      <li>Áreas de entrega com taxas</li>
                      <li>Painel administrativo completo</li>
                      <li>Sistema de pedidos em tempo real</li>
                      <li>Programa de fidelização</li>
                    </ul>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Você receberá um email com as credenciais de acesso. Um email de confirmação será enviado para
                    <strong> {watch('admin_email')}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="submit" disabled={!isValid || isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        🎉 Criar Meu App
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
