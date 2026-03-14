import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate webhook signature
async function validateWebhookSignature(body: string, signature: string): Promise<boolean> {
  const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    console.warn('⚠️ [WEBHOOK-VALIDATION] MERCADO_PAGO_WEBHOOK_SECRET not configured - allowing webhook (development mode)');
    return true; // Allow if secret not configured (for testing)
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(body + webhookSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const isValid = computedSignature === signature;
    if (!isValid) {
      console.warn('⚠️ [WEBHOOK-VALIDATION] Invalid signature - expected:', computedSignature, '- received:', signature);
    } else {
      console.log('✅ [WEBHOOK-VALIDATION] Signature validated successfully');
    }
    return isValid;
  } catch (error) {
    console.error('❌ [WEBHOOK-VALIDATION] Signature validation error:', error, '- allowing webhook in development mode');
    return true; // Allow on validation error for development/testing
  }
}

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const body = await req.text();
    const signature = req.headers.get('x-signature') || '';
    
    // Validate signature (logs warnings but allows webhook to proceed for development)
    await validateWebhookSignature(body, signature);

    const payloadData = JSON.parse(body);
    console.log('📨 Webhook received:', JSON.stringify(payloadData, null, 2));

    // Handle payment notification
    if (payloadData.type === 'payment' && payloadData.data?.id) {
      const paymentId = payloadData.data.id;
      
      // Obter de forma temporária para buscar tenantId
      let accessToken;
      let tenantId: string | undefined;
      
      // Buscar tenantId a partir do pending_pix_order (se existe)
      try {
        const orderId = payloadData.data.external_reference;
        if (orderId) {
          const { data: pendingOrder } = await supabase
            .from('pending_pix_orders')
            .select('order_payload')
            .eq('id', orderId)
            .single();
          
          if (pendingOrder?.order_payload?.tenantId) {
            tenantId = pendingOrder.order_payload.tenantId;
            console.log(`📋 Tenant encontrado no pending_pix_order: ${tenantId}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar tenantId de pending_pix_orders:', error);
      }
      
      // Obter token de acesso com tenant específico
      try {
        accessToken = await getAccessToken(supabase, tenantId);
      } catch (error) {
        console.error('❌ Erro ao obter token de acesso:', error);
        return new Response(JSON.stringify({ error: 'No access token available' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment details: ${paymentResponse.statusText}`);
      }

      const paymentData = await paymentResponse.json();
      console.log('💳 Payment data:', JSON.stringify(paymentData, null, 2));

      const orderId = paymentData.external_reference;
      const status = paymentData.status;
      const mpStatus = paymentData.status;

      // Map Mercado Pago status to our status
      const statusMap: Record<string, string> = {
        'approved': 'confirmed',
        'pending': 'pending',
        'in_process': 'processing',
        'rejected': 'rejected',
        'cancelled': 'cancelled',
        'refunded': 'refunded'
      };

      const mappedStatus = statusMap[status] || status;
      console.log(`📋 Order ${orderId} payment status: ${status} → ${mappedStatus}`);

      // ============================================================
      // ✅ SE PAGAMENTO APROVADO: Tentar criar pedido completo
      // ============================================================
      if (status === 'approved' && orderId) {
        try {
          // 1️⃣ Verificar se pedido já existe
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .single();

          if (!existingOrder) {
            // 2️⃣ Tentar recuperar dados do pending_pix_order
            console.log(`🔍 Procurando dados do pedido em pending_pix_orders...`);
            const { data: pendingOrder } = await supabase
              .from('pending_pix_orders')
              .select('order_payload, customer_name, customer_phone, customer_email, customer_id')
              .eq('id', orderId)
              .single();

            if (pendingOrder?.order_payload) {
              // 3️⃣ Criar ordem completa com dados do pending
              console.log(`✅ Dados encontrados! Criando pedido completo...`);
              
              // Normalizar payload para schema flat do banco
              const normalizedPayload = {
                // ID e status
                id: orderId,
                status: 'confirmed',
                payment_status: 'approved',
                payment_confirmed_at: new Date().toISOString(),
                mercado_pago_id: paymentId.toString(),
                
                // Customer (flatteado de pendingOrder individual fields e do payload)
                customer_name: pendingOrder.customer_name || pendingOrder.order_payload.customer?.name || '',
                customer_phone: pendingOrder.customer_phone || pendingOrder.order_payload.customer?.phone || '',
                email: pendingOrder.customer_email || pendingOrder.order_payload.customer?.email || '',
                customer_id: pendingOrder.customer_id || pendingOrder.order_payload.customer_id || null,
                
                // Delivery
                delivery_fee: pendingOrder.order_payload.delivery?.fee || pendingOrder.order_payload.totals?.deliveryFee || 0,
                address: pendingOrder.order_payload.delivery?.address || null,
                
                // Payment
                payment_method: pendingOrder.order_payload.payment?.method || 'pix',
                
                // Totals
                subtotal: pendingOrder.order_payload.totals?.subtotal || 0,
                total: pendingOrder.order_payload.totals?.total || 0,
                points_discount: pendingOrder.order_payload.totals?.pointsDiscount || 0,
                points_redeemed: pendingOrder.order_payload.totals?.pointsRedeemed || 0,
                coupon_discount: pendingOrder.order_payload.totals?.couponDiscount || 0,
                applied_coupon: pendingOrder.order_payload.totals?.appliedCoupon || null,
                
                // Observations
                observations: pendingOrder.order_payload.observations || '',
                
                // Tenant
                tenant_id: pendingOrder.order_payload.tenantId || pendingOrder.order_payload.tenant_id || tenantId || 'default',
                
                // Items
                items: pendingOrder.order_payload.items || [],
                
                // Timestamp
                created_at: new Date().toISOString(),
              };
              
              const { error: createError } = await supabase
                .from('orders')
                .insert([normalizedPayload]);

              if (createError) {
                console.error(`❌ Erro ao criar pedido ${orderId}:`, createError);
              } else {
                console.log(`✅ Pedido ${orderId} criado com sucesso pelo webhook!`);
                
                // 4️⃣ Limpar pending_pix_order
                try {
                  await supabase
                    .from('pending_pix_orders')
                    .delete()
                    .eq('id', orderId);
                  console.log(`✅ Pedido removido de pending_pix_orders`);
                } catch (error) {
                  console.warn(`⚠️ Falha ao limpar pending_pix_order:`, error);
                }
              }
            } else {
              console.warn(`⚠️ Pedido pendente não encontrado para ${orderId}. Será criado apenas registro de pagamento.`);
            }
          } else {
            console.log(`✅ Pedido ${orderId} já existe. Apenas atualizando status de pagamento...`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar pedido aprovado ${orderId}:`, error);
        }
      }

      // ============================================================
      // 🔄 UPDATE ORDER STATUS NO BANCO (se existir)
      // ============================================================
      if (orderId) {
        try {
          // Se PIX foi aprovado, muda status para "confirmado" automaticamente
          const shouldAutoConfirm = status === 'approved';
          
          const updateData: any = {
            payment_status: mpStatus,
            payment_confirmed_at: status === 'approved' ? new Date().toISOString() : null,
            mercado_pago_id: paymentId.toString(),
          };

          // PIX aprovado: mudar para "confirmed" automatically
          if (shouldAutoConfirm) {
            updateData.status = 'confirmed';
            updateData.auto_confirmed_by_pix = true;
            console.log(`🤖 PIX aprovado! Alterando automaticamente status para "confirmed"...`);
          }

          const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

          if (updateError) {
            console.error(`❌ Erro ao atualizar order ${orderId}:`, updateError);
          } else {
            console.log(`✅ Order ${orderId} atualizado com status: ${mpStatus}${shouldAutoConfirm ? ' + Auto-confirmado' : ''}`);
            
            // 📱 Enviar notificação WhatsApp se PIX foi aprovado
            if (shouldAutoConfirm) {
              try {
                // Buscar dados do pedido para notificação
                const { data: orderData } = await supabase
                  .from('orders')
                  .select('id, customer_name, customer_phone, tenant_id')
                  .eq('id', orderId)
                  .single();

                if (orderData?.customer_phone && orderData?.tenant_id) {
                  // Chamar edge function de notificação (assíncrono)
                  console.log(`📲 Enviando notificação de confirmação para ${orderData.customer_phone}`);
                  
                  // Realizar a chamada assincronamente sem aguardar
                  fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    },
                    body: JSON.stringify({
                      orderId: orderId,
                      status: 'confirmed',
                      phone: orderData.customer_phone,
                      customerName: orderData.customer_name || 'Cliente',
                      tenantId: orderData.tenant_id,
                    }),
                  }).catch((err) => {
                    console.warn(`⚠️ Falha ao enviar notificação WhatsApp via webhook:`, err);
                  });
                }
              } catch (notificationError) {
                console.warn(`⚠️ Erro ao processar notificação:`, notificationError);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Exception ao atualizar order ${orderId}:`, error);
        }
      }

      // ============================================================
      // 📧 NOTIFICAÇÕES - TODO para desenvolvimentos futuros
      // ============================================================
      // Se rejection, notificar admin
      if (status === 'rejected') {
        console.warn(`⚠️ Pagamento rejeitado - Order ${orderId}. Considerar notificação ao admin.`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('❌ Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
