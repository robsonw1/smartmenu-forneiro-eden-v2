import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Hook que verifica e corrige schedule incompleto na inicialização
 * Se o schedule tem < 7 dias, preenche os days faltantes com defaults
 */
export function useScheduleSync() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  useEffect(() => {
    const checkAndFixSchedule = async () => {
      const schedule = settings.schedule;
      
      if (!schedule) {
        console.warn('⚠️  [SCHEDULE-SYNC] Schedule não encontrado');
        return;
      }

      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const presentDays = Object.keys(schedule) as (keyof typeof schedule)[];
      const missingDays = allDays.filter(day => !presentDays.includes(day as any));

      console.log('🔍 [SCHEDULE-SYNC] Verificando schedule:', {
        totalDias: presentDays.length,
        diasPresentes: presentDays,
        diasFaltando: missingDays,
      });

      if (missingDays.length > 0) {
        console.warn(`⚠️  [SCHEDULE-SYNC] Schedule incompleto! Faltam ${missingDays.length} dias:`, missingDays);
        
        // Corrigir o schedule com os days faltantes
        const correctedSchedule = { ...schedule };
        
        const defaultDaySchedule = {
          isOpen: true,
          openTime: '18:00',
          closeTime: '23:00',
        };

        const specialDefaults: Record<string, any> = {
          monday: { isOpen: false, openTime: '18:00', closeTime: '23:00' }, // Segunda fechada por padrão
          saturday: { isOpen: true, openTime: '17:00', closeTime: '00:00' }, // Sábado abre mais cedo, fecha depois
          sunday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },   // Domingo abre mais cedo
        };

        // Preencher dias faltantes
        for (const day of missingDays) {
          const dayKey = day as keyof typeof correctedSchedule;
          correctedSchedule[dayKey] = specialDefaults[day] || defaultDaySchedule;
          console.log(`✅ [SCHEDULE-SYNC] Adicionando ${day}:`, correctedSchedule[dayKey]);
        }

        // Atualizar settings com schedule completo
        console.log('💾 [SCHEDULE-SYNC] Salvando schedule CORRIGIDO:', correctedSchedule);
        await updateSettings({
          schedule: correctedSchedule as any,
        });

        console.log('✅ [SCHEDULE-SYNC] Schedule corrigido e sincronizado com sucesso!');
      } else {
        console.log('✅ [SCHEDULE-SYNC] Schedule PERFEITO - todos os 7 dias presentes');
      }
    };

    checkAndFixSchedule();
  }, []);
}
