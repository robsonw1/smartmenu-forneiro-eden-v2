// Templates padrão para novo tenant

export const DEFAULT_PRODUCTS = [
  {
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mozzarella, manjericão fresco',
    price: 35.00,
    category: 'Tradicional',
    image_url: '/logo-forneiro.jpg',
    is_available: true,
  },
  {
    name: 'Pizza Pepperoni',
    description: 'Molho de tomate, mozzarella, pepperoni',
    price: 38.00,
    category: 'Tradicional',
    image_url: '/logo-forneiro.jpg',
    is_available: true,
  },
  {
    name: 'Pizza 4 Queijos',
    description: 'Mozzarella, gorgonzola, parmesão, requeijão',
    price: 42.00,
    category: 'Premium',
    image_url: '/logo-forneiro.jpg',
    is_available: true,
  },
  {
    name: 'Combo Família',
    description: '2 pizzas grandes + 1 refrigerante 2L + borda recheada',
    price: 89.90,
    category: 'Combo',
    image_url: '/logo-forneiro.jpg',
    is_available: true,
  },
];

export const DEFAULT_SETTINGS = {
  deliveryTimeMin: 30,
  deliveryTimeMax: 60,
  pickupTimeMin: 15,
  pickupTimeMax: 30,
  orderAlertEnabled: true,
  sendOrderSummaryToWhatsApp: false,
  enableScheduling: false,
  minScheduleMinutes: 30,
  maxScheduleDays: 7,
  allowSchedulingOnClosedDays: false,
  allowSchedulingOutsideBusinessHours: false,
  respectBusinessHoursForScheduling: true,
  allowSameDaySchedulingOutsideHours: false,
  timezone: 'America/Sao_Paulo',
};

export const DEFAULT_WEEK_SCHEDULE = {
  monday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  thursday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
  friday: { isOpen: true, openTime: '18:00', closeTime: '23:30' },
  saturday: { isOpen: true, openTime: '17:00', closeTime: '00:30' },
  sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
};

export const DEFAULT_NEIGHBORHOODS = [
  {
    name: 'Centro',
    deliveryTimeMin: 30,
    deliveryTimeMax: 40,
    deliveryFee: 5.00,
    isActive: true,
  },
  {
    name: 'Zona Norte',
    deliveryTimeMin: 40,
    deliveryTimeMax: 50,
    deliveryFee: 7.00,
    isActive: true,
  },
  {
    name: 'Zona Sul',
    deliveryTimeMin: 45,
    deliveryTimeMax: 60,
    deliveryFee: 8.00,
    isActive: true,
  },
];

export const EMAIL_TEMPLATE = (tenantName: string, adminEmail: string, password: string, appUrl: string) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { background: white; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #ff9500 0%, #ff7a00 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; }
      .credentials { background: #f9f9f9; border-left: 4px solid #ff9500; padding: 20px; margin: 20px 0; border-radius: 4px; }
      .credentials p { margin: 10px 0; }
      .credentials strong { color: #ff9500; }
      .button { display: inline-block; background: #ff9500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Bem-vindo ao SmartMenu!</h1>
        <p>Seu app está pronto para usar</p>
      </div>
      
      <div class="content">
        <h2>Olá! 👋</h2>
        <p>Seu app <strong>${tenantName}</strong> foi criado com sucesso!</p>
        
        <p>Estamos entusiasmados em tê-lo conosco. Abaixo estão suas credenciais de acesso ao painel administrativo:</p>
        
        <div class="credentials">
          <p><strong>Email:</strong> ${adminEmail}</p>
          <p><strong>Senha Temporária:</strong> ${password}</p>
          <p style="color: #d32f2f; font-size: 12px;">⚠️ Recomendamos alterar a senha assim que fizer o primeiro login</p>
        </div>
        
        <p><strong>Seu aplicativo está disponível em:</strong></p>
        <a href="${appUrl}" class="button">Acessar Seu App →</a>
        
        <h3>🚀 Próximos Passos:</h3>
        <ol>
          <li>Acesse seu painel administrativo com as credenciais acima</li>
          <li>Customize seus horários de funcionamento</li>
          <li>Adicione seus produtos/cardápio completo</li>
          <li>Configure suas áreas de entrega</li>
          <li>Personalize cores e logo do seu app</li>
          <li>Ative as integrações desejadas (WhatsApp, Mercado Pago, etc)</li>
        </ol>
        
        <p>Se tiver dúvidas, entre em contato conosco!</p>
        
        <p>Abraços,<br><strong>SmartMenu Equipe</strong></p>
      </div>
      
      <div class="footer">
        <p>© 2026 SmartMenu. Todos os direitos reservados.</p>
        <p>Este é um email automático. Por favor, não responda.</p>
      </div>
    </div>
  </body>
</html>
`;
