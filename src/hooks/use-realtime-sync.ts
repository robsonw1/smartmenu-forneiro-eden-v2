import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useOrdersStore } from '@/store/useOrdersStore';
import { useNeighborhoodsStore } from '@/store/useNeighborhoodsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Product, Order, Neighborhood } from '@/data/products';

/**
 * Converte os dados do Supabase (JSON) para o formato Product esperado
 */
const parseProductFromSupabase = (supabaseData: any): Product => {
  let data = supabaseData.data || {};
  
  // Se data for string (às vezes Supabase retorna como JSON string), fazer parse
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.warn('❌ Erro ao fazer parse de data JSON:', e);
      data = {};
    }
  }
  
  // ✅ Determinar isActive: se está explicitamente false, é false. Caso contrário, true
  const isActive = data.is_active === true || (data.is_active !== false && data.is_active !== undefined);
  
  console.log('🔄 Parseando produto do Realtime:', {
    id: supabaseData.id,
    name: supabaseData.name,
    is_active_raw: data.is_active,
    is_active_parsed: isActive,
  });
  
  return {
    id: supabaseData.id,
    name: supabaseData.name || data.name,
    description: data.description || '',
    ingredients: data.ingredients || [],
    category: data.category || 'combos',
    price: data.price ?? undefined,
    priceSmall: data.priceSmall ?? undefined,
    priceLarge: data.priceLarge ?? undefined,
    image: data.image,
    isPopular: data.is_popular ?? false,
    isNew: data.is_new ?? false,
    isVegetarian: data.is_vegetarian ?? false,
    isActive: isActive,
    isCustomizable: data.is_customizable ?? false,
  };
};

/**
 * Hook que sincroniza os dados da aplicação com o Supabase em tempo real
 * Carrega os dados iniciais e escuta mudanças em produtos, pedidos, bairros e configurações
 * 
 * ESTRATÉGIA PRODUTOS:
 * - Webhook Realtime: Primeira opção (ideal)
 * - Polling (10s): Fallback se webhook falhar
 * - Ambos usam parseProductFromSupabase() para converter dados corretamente
 */
export const useRealtimeSync = () => {
  useEffect(() => {
    console.log('🚀 Iniciando useRealtimeSync hook...');
    let isMounted = true;
    let productsPollInterval: NodeJS.Timeout | null = null;
    let neighborhoodsPollInterval: NodeJS.Timeout | null = null;

    // Função para sincronizar produtos via SELECT fresh (usado por webhook e polling)
    const syncProductsFromSupabase = async () => {
      if (!isMounted) return;
      
      try {
        const { data: products } = await (supabase as any)
          .from('products')
          .select('*');
        
        if (products && isMounted) {
          const catalogStore = useCatalogStore.getState();
          for (const product of products) {
            catalogStore.upsertProduct(parseProductFromSupabase(product));
          }
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar produtos:', error);
      }
    };

    // Função para sincronizar bairros via SELECT fresh (usado por webhook e polling)
    const syncNeighborhoodsFromSupabase = async () => {
      if (!isMounted) return;
      
      try {
        const { data: neighborhoods } = await (supabase as any)
          .from('neighborhoods')
          .select('*');
        
        if (neighborhoods && isMounted) {
          const neighborhoodsStore = useNeighborhoodsStore.getState();
          for (const neighborhood of neighborhoods) {
            neighborhoodsStore.upsertNeighborhood(neighborhood as Neighborhood);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar bairros:', error);
      }
    };

    // Função para carregar dados iniciais
    const loadInitialData = async () => {
      if (!isMounted) return;
      
      try {
        // Delay mínimo para garantir que localStorage foi carregado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Carregar produtos
        const { data: products } = await (supabase as any)
          .from('products')
          .select('*');
        
        if (products && isMounted) {
          const catalogStore = useCatalogStore.getState();
          console.log(`✅ Carregados ${products.length} produtos inicialmente`);
          for (const product of products) {
            catalogStore.upsertProduct(parseProductFromSupabase(product));
          }
        }

        // ⚠️  NÃO carregar settings aqui - deixar AdminDashboard.tsx fazer isso
        // Se carregar aqui, sobrescreve dados recém-salvos com dados antigos do banco
        // O AdminDashboard.tsx chama loadSettingsFromSupabase() na montagem
        // useRealtimeSync apenas escuta mudanças posteriores via subscription

        // Carregar bairros
        const { data: neighborhoods } = await (supabase as any)
          .from('neighborhoods')
          .select('*');
        
        if (neighborhoods && isMounted) {
          const neighborhoodsStore = useNeighborhoodsStore.getState();
          for (const neighborhood of neighborhoods) {
            neighborhoodsStore.upsertNeighborhood(neighborhood as Neighborhood);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };

    loadInitialData();

    // ✅ WEBHOOK REALTIME: Primeira opção para sincronizar produtos
    // Sincronizar Produtos (Catálogo)
    const productsChannel = supabase
      .channel('realtime:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          if (!isMounted) return;
          console.log('🔔 Webhook Produtos Realtime recebido:', payload.eventType, payload.new?.id, payload.new?.name);
          
          const catalogStore = useCatalogStore.getState();
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const product = parseProductFromSupabase(payload.new as any);
            console.log('✅ Atualizando produto via webhook:', product.id, 'isActive:', product.isActive);
            catalogStore.upsertProduct(product);
          } else if (payload.eventType === 'DELETE') {
            const oldProduct = payload.old as any;
            console.log('🗑️ Removendo produto via webhook:', oldProduct.id);
            catalogStore.removeProduct(oldProduct.id);
          }
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [REALTIME-PRODUCTS] Canal Realtime ATIVO - ouvindo mudanças');
        } else if (error) {
          console.error('❌ [REALTIME-PRODUCTS] Erro ao conectar:', error?.message);
          console.log('🔄 [REALTIME-PRODUCTS] Ativando polling fallback para produtos...');
        }
      });

    // ⏰ POLLING FALLBACK: Se webhook falhar, faz sync a cada 10 segundos
    productsPollInterval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔄 [PRODUCTS-POLLING] Verificando atualizações de produtos...');
        await syncProductsFromSupabase();
      } catch (err) {
        console.error('❌ [PRODUCTS-POLLING] Erro no polling:', err);
      }
    }, 10000); // 10 segundos

    // ⏰ POLLING FALLBACK: Se webhook de bairros falhar, faz sync a cada 10 segundos
    neighborhoodsPollInterval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔄 [NEIGHBORHOODS-POLLING] Verificando atualizações de bairros...');
        await syncNeighborhoodsFromSupabase();
      } catch (err) {
        console.error('❌ [NEIGHBORHOODS-POLLING] Erro no polling:', err);
      }
    }, 10000); // 10 segundos

    // Sincronizar Pedidos
    const ordersChannel = supabase
      .channel('realtime:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          if (!isMounted) return;
          const ordersStore = useOrdersStore.getState();
          
          if (payload.eventType === 'INSERT') {
            // Novo pedido foi criado - sincronizar para pegar todos os dados
            // Não chamar addOrder aqui pois causariam duplicação (já foi inserido no BD)
            ordersStore.syncOrdersFromSupabase();
          } else if (payload.eventType === 'UPDATE') {
            // Pedido foi atualizado - sincronizar para pegar dados atualizados (status, printed_at, etc)
            ordersStore.syncOrdersFromSupabase();
          } else if (payload.eventType === 'DELETE') {
            ordersStore.removeOrder((payload.old as Order).id);
          }
        }
      )
      .subscribe();

    // Sincronizar Bairros
    const neighborhoodsChannel = supabase
      .channel('realtime:neighborhoods')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'neighborhoods' },
        (payload: any) => {
          if (!isMounted) return;
          console.log('🔔 Webhook Bairros Realtime recebido:', payload.eventType, payload.new?.id || payload.old?.id, payload.new?.name || payload.old?.name);
          
          const neighborhoodsStore = useNeighborhoodsStore.getState();
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            console.log('✅ Atualizando bairro via webhook:', payload.new.id, 'status:', payload.new.is_active);
            neighborhoodsStore.upsertNeighborhood(payload.new as Neighborhood);
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Removendo bairro via webhook:', payload.old.id);
            neighborhoodsStore.removeNeighborhood((payload.old as Neighborhood).id);
          }
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [REALTIME-NEIGHBORHOODS] Canal Realtime ATIVO - ouvindo mudanças');
        } else if (error) {
          console.error('❌ [REALTIME-NEIGHBORHOODS] Erro ao conectar:', error?.message);
          console.log('🔄 [REALTIME-NEIGHBORHOODS] Ativando polling fallback para bairros...');
        }
      });

    // ⚠️ NOTA: Sincronização de Settings agora é feita exclusivamente em use-settings-realtime-sync.ts
    // para evitar conflito de canais realtime. Este hook foi removido daqui.

    // Cleanup: Desinscrever de todos os canais ao desmontar e limpar polling
    return () => {
      isMounted = false;
      if (productsPollInterval) {
        clearInterval(productsPollInterval);
        console.log('🛑 [PRODUCTS-POLLING] Polling de produtos finalizado');
      }
      if (neighborhoodsPollInterval) {
        clearInterval(neighborhoodsPollInterval);
        console.log('🛑 [NEIGHBORHOODS-POLLING] Polling de bairros finalizado');
      }
      productsChannel.unsubscribe();
      ordersChannel.unsubscribe();
      neighborhoodsChannel.unsubscribe();
    };
  }, []);
};
