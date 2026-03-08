import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook que sincroniza as configurações em tempo real do Supabase
 * SINCRONIZA: isManuallyOpen (CRÍTICO), schedule, timing, etc
 * TAMBÉM: Recalcula isStoreOpen() a cada minuto para detectar mudanças de horário
 */
export function useSettingsRealtimeSync() {
  const loadSettingsLocally = useSettingsStore((s) => s.loadSettingsLocally);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    let isSubscribed = true;
    let channel: any = null;
    let timeCheckInterval: NodeJS.Timeout | null = null;

    const setupRealtimeSync = async () => {
      try {
        console.log('🔄 [SETTINGS-SYNC] Carregando configurações do Supabase...');
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'store-settings')
          .single();

        if (error) {
          console.error('❌ [SETTINGS-SYNC] Erro ao carregar settings:', error.message);
          return;
        }

        if (data && isSubscribed) {
          console.log('📥 [SETTINGS-SYNC] Configurações carregadas com sucesso');
          
          const settingsData = data as any;
          const valueJson = settingsData.value || {};
          
          // ✅ CRÍTICO: Se schedule vazio, usar defaults
          const loadedSchedule = valueJson.schedule || {
            monday: { isOpen: false, openTime: '18:00', closeTime: '23:00' },
            tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            thursday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            friday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            saturday: { isOpen: true, openTime: '17:00', closeTime: '00:00' },
            sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
          };
          
          console.log('👀 [SETTINGS-SYNC] is_manually_open:', settingsData.is_manually_open);
          console.log('⏰ [SETTINGS-SYNC] schedule carregado:', loadedSchedule);
          console.log('📊 [SETTINGS-SYNC] Dias no schedule:', Object.keys(loadedSchedule));

          // ✅ OPÇÃO B: Ler de colunas normalizadas + JSON para dados complexos
          // ✅ NOVO: Usar loadSettingsLocally (SÓ em memória, SEM resalvar)
          loadSettingsLocally({
            name: valueJson.name || 'Forneiro Éden',
            phone: valueJson.phone || '(11) 99999-9999',
            address: valueJson.address || 'Rua das Pizzas, 123 - Centro',
            slogan: valueJson.slogan || 'A Pizza mais recheada da cidade 🇮🇹',
            schedule: loadedSchedule,
            isManuallyOpen: settingsData.is_manually_open ?? true,
            deliveryTimeMin: valueJson.deliveryTimeMin ?? 60,
            deliveryTimeMax: valueJson.deliveryTimeMax ?? 70,
            pickupTimeMin: valueJson.pickupTimeMin ?? 40,
            pickupTimeMax: valueJson.pickupTimeMax ?? 50,
            orderAlertEnabled: valueJson.orderAlertEnabled ?? true,
            sendOrderSummaryToWhatsApp: valueJson.sendOrderSummaryToWhatsApp ?? false,
            printnode_printer_id: settingsData.printnode_printer_id || null,
            print_mode: settingsData.print_mode || 'auto',
            auto_print_pix: settingsData.auto_print_pix ?? false,
            auto_print_card: settingsData.auto_print_card ?? false,
            auto_print_cash: settingsData.auto_print_cash ?? false,
            enableScheduling: settingsData.enable_scheduling ?? false,
            minScheduleMinutes: settingsData.min_schedule_minutes ?? 30,
            maxScheduleDays: settingsData.max_schedule_days ?? 7,
            allowSchedulingOnClosedDays: settingsData.allow_scheduling_on_closed_days ?? false,
            allowSchedulingOutsideBusinessHours: settingsData.allow_scheduling_outside_business_hours ?? false,
            respectBusinessHoursForScheduling: settingsData.respect_business_hours_for_scheduling ?? true,
            allowSameDaySchedulingOutsideHours: settingsData.allow_same_day_scheduling_outside_hours ?? false,
          });
          
          console.log('✅ [SETTINGS-SYNC] Store atualizado com SUCESSO na primeira carga');
        }
      } catch (error) {
        console.error('❌ [SETTINGS-SYNC] Erro ao configurar realtime:', error);
      }
    };

    setupRealtimeSync();

    // Inscrever-se a mudanças em TEMPO REAL
    channel = supabase
      .channel('settings-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settings',
          filter: 'id=eq.store-settings',
        },
        async (payload: any) => {
          if (!isSubscribed) return;

          console.log('⚡⚡⚡ [SETTINGS-SYNC] MUDANÇA DETECTADA EM TEMPO REAL ⚡⚡⚡');
          
          const newData = payload.new as any;
          const newValueJson = newData.value || {};
          
          // ✅ CRÍTICO: Se schedule vazio, usar defaults
          const newLoadedSchedule = newValueJson.schedule || {
            monday: { isOpen: false, openTime: '18:00', closeTime: '23:00' },
            tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            thursday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            friday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
            saturday: { isOpen: true, openTime: '17:00', closeTime: '00:00' },
            sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
          };
          
          console.log('🔴 [SETTINGS-SYNC] NOVO is_manually_open:', newData.is_manually_open);
          console.log('� [SETTINGS-SYNC] Novos horários carregados:', Object.entries(newLoadedSchedule).reduce((acc: any, [day, schedule]: any) => {
            acc[day] = `${schedule.openTime}-${schedule.closeTime}`;
            return acc;
          }, {}));

          // ✅ OPÇÃO B: Atualizar de colunas normalizadas + JSON
          // ✅ NOVO: Usar loadSettingsLocally (SÓ em memória, SEM resalvar)
          loadSettingsLocally({
            name: newValueJson.name || 'Forneiro Éden',
            phone: newValueJson.phone || '(11) 99999-9999',
            address: newValueJson.address || 'Rua das Pizzas, 123 - Centro',
            slogan: newValueJson.slogan || 'A Pizza mais recheada da cidade 🇮🇹',
            schedule: newLoadedSchedule,
            isManuallyOpen: newData.is_manually_open ?? true,
            deliveryTimeMin: newValueJson.deliveryTimeMin ?? 60,
            deliveryTimeMax: newValueJson.deliveryTimeMax ?? 70,
            pickupTimeMin: newValueJson.pickupTimeMin ?? 40,
            pickupTimeMax: newValueJson.pickupTimeMax ?? 50,
            orderAlertEnabled: newValueJson.orderAlertEnabled ?? true,
            sendOrderSummaryToWhatsApp: newValueJson.sendOrderSummaryToWhatsApp ?? false,
            printnode_printer_id: newData.printnode_printer_id || null,
            print_mode: newData.print_mode || 'auto',
            auto_print_pix: newData.auto_print_pix ?? false,
            auto_print_card: newData.auto_print_card ?? false,
            auto_print_cash: newData.auto_print_cash ?? false,
            enableScheduling: newData.enable_scheduling ?? false,
            minScheduleMinutes: newData.min_schedule_minutes ?? 30,
            maxScheduleDays: newData.max_schedule_days ?? 7,
            allowSchedulingOnClosedDays: newData.allow_scheduling_on_closed_days ?? false,
            allowSchedulingOutsideBusinessHours: newData.allow_scheduling_outside_business_hours ?? false,
            respectBusinessHoursForScheduling: newData.respect_business_hours_for_scheduling ?? true,
            allowSameDaySchedulingOutsideHours: newData.allow_same_day_scheduling_outside_hours ?? false,
          });

          console.log('✅✅✅ [SETTINGS-SYNC] Store SINCRONIZADO em tempo real ✅✅✅');
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [SETTINGS-SYNC] Canal Realtime ATIVO - ouvindo mudanças');
        } else if (status === 'CLOSED') {
          console.log('🔴 [SETTINGS-SYNC] Canal Realtime FECHADO');
        } else if (error) {
          console.error('❌ [SETTINGS-SYNC] Erro:', error);
        }
      });

    // ⏰ VERIFICAÇÃO A CADA MINUTO: Recalcular isStoreOpen() para detectar mudanças de horário
    // Removido: updateSettings causaria resalvamento. A recalculação acontece via hooks de realtime
    timeCheckInterval = setInterval(() => {
      if (isSubscribed) {
        console.log('⏰ [TIME-CHECK] Verificação de horário (a cada minuto)');
      }
    }, 60000); // 60 segundos = 1 minuto

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
      }
    };
  }, []);
}
