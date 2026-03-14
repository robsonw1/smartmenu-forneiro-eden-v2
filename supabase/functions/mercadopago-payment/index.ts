import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obter token de acesso (tenant específico ou fallback do sistema)
async function getAccessToken(supabase: any, tenantId?: string): Promise<string> {
  const fallbackToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  
  console.log('🔑 [GET-ACCESS-TOKEN] Iniciando busca:', { 
    tenantIdProvided: !!tenantId,
    tenantId: tenantId || 'undefined',
    hasFallbackToken: !!fallbackToken
  });

  // Tentar buscar token do tenant específico (APENAS se tenantId for válido)
  if (tenantId && tenantId.trim()) {
    try {
      console.log(`🔍 Buscando token do tenant específico: ${tenantId}`);
      const { data, error } = await supabase
        .from('tenants')
        .select('id, mercadopago_access_token')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.warn(`⚠️ Erro ao buscar tenant ${tenantId}:`, error.message);
      } else if (data?.mercadopago_access_token) {
        console.log(`✅ Usando token do tenant específico: ${data.id}`);
        return data.mercadopago_access_token;
      } else {
        console.warn(`⚠️ Tenant ${tenantId} não tem token configurado`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar token do tenant ${tenantId}:`, error);
    }
  } else {
    console.log('⚠️ TenantId não fornecido ou vazio, pulando busca específica');
  }

  // Fallback para primeiro tenant (compatibilidade)
  try {
    console.log('🔍 Buscando token do primeiro tenant (fallback)...');
    const { data, error } = await supabase
      .from('tenants')
      .select('id, mercadopago_access_token')
      .limit(1)
      .single();

    if (error) {
      console.warn('⚠️ Erro ao buscar primeiro tenant:', error.message);
    } else if (data?.mercadopago_access_token) {
      console.log(`✅ Usando token do tenant padrão: ${data.id}`);
      return data.mercadopago_access_token;
    } else {
      console.warn('⚠️ Primeiro tenant não tem token configurado');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar primeiro tenant:', error);
  }

  // Fallback final para env var
  if (fallbackToken) {
    console.log('⚠️ Usando token do sistema (fallback)');
    return fallbackToken;
  }

  // Se chegou aqui, erro crítico
  const errorMsg = 'MERCADO_PAGO_ACCESS_TOKEN not configured and no tenant tokens found';
  console.error('❌ ' + errorMsg);
  throw new Error(errorMsg);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // 🔍 DEBUG LOGS - Removidas após issue resolvida
    console.log('🔧 [DEBUG] Inicializando Supabase:', {
      url: supabaseUrl?.substring(0, 30) + '...',
      keyLength: supabaseKey?.length || 0
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // IMPORTANTE: Extrair body PRIMEIRO antes de usar tenantId
    const body = await req.json();
    const { 
      orderId,
      tenantId = undefined,
      amount, 
      description, 
      payerEmail,
      payerName,
      payerPhone,
      payerCpf,
      items,
      paymentType // 'pix' or 'preference'
    } = body;

    let accessToken;
    try {
      console.log('🔑 Tentando obter accessToken...', { tenantId: tenantId || 'undefined' });
      accessToken = await getAccessToken(supabase, tenantId);
      console.log('✅ AccessToken obtido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : String(error),
        tenantId
      });
      throw error;
    }
    
    console.log('🔧 [MERCADOPAGO-PAYMENT] Body recebido:', {
      orderId,
      tenantId,
      paymentType,
      amount
    });

    // If paymentType is 'pix', create a PIX payment directly
    if (paymentType === 'pix') {
      // Clean CPF - remove non-digits
      const cleanCpf = payerCpf?.replace(/\D/g, '') || '';
      
      const pixPayment = {
        transaction_amount: Number(amount.toFixed(2)),
        description: description || `Pedido ${orderId}`,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail || 'cliente@email.com',
          first_name: payerName?.split(' ')[0] || 'Cliente',
          last_name: payerName?.split(' ').slice(1).join(' ') || '',
          identification: {
            type: 'CPF',
            number: cleanCpf
          }
        },
        external_reference: orderId,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
      };

      console.log('Creating PIX payment:', JSON.stringify(pixPayment, null, 2));

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': orderId
        },
        body: JSON.stringify(pixPayment)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Mercado Pago PIX error:', data);
        throw new Error(data.message || 'Failed to create PIX payment');
      }

      console.log('PIX payment created:', data.id);

      // Return PIX data
      return new Response(JSON.stringify({
        paymentId: data.id,
        status: data.status,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url,
        expirationDate: data.date_of_expiration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default: Create checkout preference for redirect
    const preference = {
      items: items.map((item: any) => ({
        id: item.id || orderId,
        title: item.name,
        quantity: item.quantity,
        unit_price: Number(item.price.toFixed(2)),
        currency_id: 'BRL'
      })),
      payer: {
        email: payerEmail || 'cliente@email.com',
        name: payerName,
        phone: {
          number: payerPhone?.replace(/\D/g, '') || ''
        }
      },
      external_reference: orderId,
      back_urls: {
        success: `${req.headers.get('origin') || 'https://localhost:3000'}/?status=approved&order=${orderId}`,
        failure: `${req.headers.get('origin') || 'https://localhost:3000'}/?status=rejected&order=${orderId}`,
        pending: `${req.headers.get('origin') || 'https://localhost:3000'}/?status=pending&order=${orderId}`
      },
      auto_return: 'approved',
      statement_descriptor: 'FORNEIRO EDEN',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
    };

    console.log('Creating Mercado Pago preference:', JSON.stringify(preference, null, 2));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || 'Failed to create payment preference');
    }

    console.log('Preference created:', data.id);

    return new Response(JSON.stringify({
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
