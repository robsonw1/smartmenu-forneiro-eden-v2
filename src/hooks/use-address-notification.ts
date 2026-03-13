import { useState, useEffect } from 'react';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';

/**
 * Hook para gerenciar notificação de endereço incompleto
 * Mostra pulse VERMELHO permanente até endereço ser preenchido e salvo
 */
export const useAddressNotification = () => {
  const [showAddressNotification, setShowAddressNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentCustomer = useLoyaltyStore((s) => s.currentCustomer);

  useEffect(() => {
    if (!currentCustomer?.id) {
      setIsLoading(false);
      return;
    }

    // Verificar se endereço está incompleto
    const hasAddress =
      currentCustomer.street &&
      currentCustomer.number &&
      currentCustomer.neighborhood;

    // Se não tem endereço → mostrar notificação
    // Se tem endereço → não mostrar (e remover do localStorage se existir)
    if (!hasAddress) {
      console.log('[ADDRESS-NOTIFICATION] 📍 Endereço incompleto detectado para:', currentCustomer.name);
      setShowAddressNotification(true);
    } else {
      console.log('[ADDRESS-NOTIFICATION] ✅ Endereço completo para:', currentCustomer.name);
      setShowAddressNotification(false);
      // Remover flag de localStorage quando endereço é salvo
      const storageKey = `address_notification_${currentCustomer.id}`;
      localStorage.removeItem(storageKey);
    }

    setIsLoading(false);
  }, [currentCustomer?.id, currentCustomer?.street, currentCustomer?.neighborhood, currentCustomer?.number]);

  /**
   * Marca que endereço foi salvo (remove notificação)
   * Chamado automaticamente quando endereço é salvo
   */
  const markAddressAsNotified = () => {
    if (!currentCustomer?.id) return;

    const storageKey = `address_notification_${currentCustomer.id}`;
    localStorage.setItem(storageKey, 'true');
    setShowAddressNotification(false);
  };

  // Resetar para testes/dev
  const resetAddressNotification = () => {
    if (!currentCustomer?.id) return;

    const storageKey = `address_notification_${currentCustomer.id}`;
    localStorage.removeItem(storageKey);
    setShowAddressNotification(true);
  };

  return {
    showAddressNotification,
    isLoading,
    markAddressAsNotified,
    resetAddressNotification,
  };
};
