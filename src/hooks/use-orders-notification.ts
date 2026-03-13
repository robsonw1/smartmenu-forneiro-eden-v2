import { useState, useEffect, useRef } from 'react';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

/**
 * Hook para gerenciar notificação de pedidos
 * Mostra pulse AZUL quando há novo pedido ou mudança de status
 * Remove pulse quando cliente visualiza o drawer de pedidos
 */
export const useOrdersNotification = () => {
  const [showOrdersNotification, setShowOrdersNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastOrdersCheckRef = useRef<string>('');

  const currentCustomer = useLoyaltyStore((s) => s.currentCustomer);

  /**
   * Verifica se há pedidos novos ou com mudança de status
   */
  useEffect(() => {
    if (!currentCustomer?.email) {
      setIsLoading(false);
      return;
    }

    const fetchOrdersStatus = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('orders')
          .select('id, status, created_at, updated_at')
          .eq('email', currentCustomer.email)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[ORDERS-NOTIFICATION] ❌ Erro ao buscar pedidos:', error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const latestOrder = data[0];
          const storageKey = `orders_notification_${currentCustomer.id}`;
          const lastViewedOrderId = localStorage.getItem(storageKey);

          // Se o pedido mais recente é diferente do último visto → mostrar notificação
          if (lastViewedOrderId !== latestOrder.id) {
            // Verificar se a mudança foi de status (não apenas criação)
            const lastCheck = lastOrdersCheckRef.current;
            const currentCheck = `${latestOrder.id}_${latestOrder.status}`;

            // Mostrar notificação se é um pedido novo ou se o status mudou
            if (lastCheck !== currentCheck) {
              setShowOrdersNotification(true);
              lastOrdersCheckRef.current = currentCheck;
            }
          } else {
            setShowOrdersNotification(false);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[ORDERS-NOTIFICATION] Erro:', error);
        setIsLoading(false);
      }
    };

    fetchOrdersStatus();

    // Setup realtime subscription para mudanças de pedidos
    const channel = (supabase as any)
      .channel(`orders:${currentCustomer.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `email=eq.${currentCustomer.email}`,
        },
        (payload: any) => {
          console.log('[ORDERS-NOTIFICATION] 🔄 Novo evento de pedido:', payload.eventType);
          // Refetch orders quando há mudança
          fetchOrdersStatus();
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[ORDERS-NOTIFICATION] ⚠️ Erro ao conectar ao canal Realtime');
        } else if (status === 'SUBSCRIBED') {
          console.log('[ORDERS-NOTIFICATION] ✅ Inscrito em eventos de pedidos');
        }
      });

    return () => {
      if (channel) {
        (supabase as any).removeChannel(channel);
      }
    };
  }, [currentCustomer?.email, currentCustomer?.id]);

  /**
   * Marca que cliente visualizou os pedidos
   * Remove a notificação de pulse
   * Chamado quando drawer de pedidos abre
   */
  const markOrdersAsViewed = async () => {
    if (!currentCustomer?.email || !currentCustomer?.id) return;

    try {
      // Buscar o pedido mais recente
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('id')
        .eq('email', currentCustomer.email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        console.error('[ORDERS-NOTIFICATION] ❌ Erro ao buscar pedido recente:', error);
        return;
      }

      const latestOrderId = data[0].id;
      const storageKey = `orders_notification_${currentCustomer.id}`;
      localStorage.setItem(storageKey, latestOrderId);
      setShowOrdersNotification(false);
    } catch (error) {
      console.error('[ORDERS-NOTIFICATION] Erro ao marcar como visto:', error);
    }
  };

  // Resetar para testes/dev
  const resetOrdersNotification = async () => {
    if (!currentCustomer?.id) return;

    const storageKey = `orders_notification_${currentCustomer.id}`;
    localStorage.removeItem(storageKey);
    lastOrdersCheckRef.current = '';
    setShowOrdersNotification(true);
  };

  return {
    showOrdersNotification,
    isLoading,
    markOrdersAsViewed,
    resetOrdersNotification,
  };
};
