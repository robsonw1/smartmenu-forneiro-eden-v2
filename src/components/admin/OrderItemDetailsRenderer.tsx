/**
 * 🎯 COMPONENTE UNIVERSAL: Renderiza detalhes de itens de pedido
 * Usado em: Dashboard, Impressão, Modal de Pedidos
 * 
 * Estrutura de dados esperada:
 * - item.product_name: Nome do produto
 * - item.size: Tamanho
 * - item.quantity: Quantidade
 * - item.item_data: JSONB com detalhes completos
 */

interface ItemData {
  pizzaType?: 'inteira' | 'meia-meia';
  sabor1?: string;
  sabor2?: string | null;
  halfOne?: string;
  halfTwo?: string | null;
  drink?: string | null;
  border?: string | null;
  extras?: string[];
  customIngredients?: string[];
  paidIngredients?: string[];
  comboPizzas?: Array<{
    pizzaId?: string;
    pizzaName?: string;
    isHalfHalf?: boolean;
    halfOne?: string;
    halfTwo?: string;
  }>;
  notes?: string | null;
}

interface OrderItemProps {
  productName: string;
  quantity: number;
  size?: string;
  totalPrice?: number;
  itemData?: ItemData | null;
  format?: 'dashboard' | 'print' | 'compact';
}

/**
 * Formata um valor para preço em BRL
 */
export const formatPrice = (price: number | undefined) => {
  if (!price) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

/**
 * Extrai o nome seguro de um ingrediente (string ou objeto)
 */
export const extractName = (value: any): string => {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return String(value.name);
  return String(value);
};

/**
 * Formata o tipo de pizza (inteira/meia-meia)
 */
export const formatPizzaType = (type?: string): string => {
  switch (type) {
    case 'meia-meia':
    case 'half-half':
      return 'Meia-Meia';
    case 'inteira':
      return 'Inteira';
    default:
      return 'Pizza';
  }
};

/**
 * Renderiza para DASHBOARD - Visual completo e formatado
 */
export const renderDashboardItem = (props: OrderItemProps): React.ReactNode => {
  const { productName, quantity, size, totalPrice, itemData, format } = props;

  return (
    <div className="flex justify-between items-start p-3 bg-secondary/50 rounded-lg text-sm space-y-1">
      <div className="flex-1">
        {/* Cabeçalho: Quantidade x Produto (Tamanho) */}
        <p className="font-semibold text-base">
          {quantity}x {productName}
          {size && ` (${size === 'broto' ? 'Broto' : size === 'grande' ? 'Grande' : size})`}
        </p>

        {itemData && (
          <div className="mt-2 space-y-1">
            {/* Tipo de Pizza */}
            {itemData.pizzaType && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Tipo:</span> {formatPizzaType(itemData.pizzaType)}
              </p>
            )}

            {/* Sabores - Pizza Simples */}
            {itemData.sabor1 && !itemData.comboPizzas?.length && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Sabor 1:</span> {extractName(itemData.sabor1)}
              </p>
            )}

            {itemData.sabor2 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Sabor 2:</span> {extractName(itemData.sabor2)}
              </p>
            )}

            {/* Meia-Meia - Partes */}
            {itemData.halfOne && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  <span className="font-medium">Metade 1:</span> {extractName(itemData.halfOne)}
                </p>
                {itemData.halfTwo && (
                  <p>
                    <span className="font-medium">Metade 2:</span> {extractName(itemData.halfTwo)}
                  </p>
                )}
              </div>
            )}

            {/* Combo Pizzas */}
            {itemData.comboPizzas && itemData.comboPizzas.length > 0 && (
              <div className="mt-2 ml-2 border-l-2 border-primary/30 pl-2">
                <p className="font-semibold text-xs">Pizzas do Combo:</p>
                {itemData.comboPizzas.map((pizza, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground mt-1">
                    <p className="font-medium">Pizza #{pizza.pizzaId?.includes('promo') ? '−' : idx + 1}</p>
                    <p className="ml-2">
                      {pizza.pizzaName}
                      {pizza.isHalfHalf && ' (Meia-Meia)'}
                    </p>
                    {pizza.isHalfHalf && (
                      <div className="ml-2 text-xs">
                        <p>
                          └─ {extractName(pizza.halfOne)} | {extractName(pizza.halfTwo)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Borda */}
            {itemData.border && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Borda:</span> {extractName(itemData.border)}
              </p>
            )}

            {/* Bebida */}
            {itemData.drink && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Bebida:</span> {extractName(itemData.drink)}
              </p>
            )}

            {/* Extras */}
            {itemData.extras && itemData.extras.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Adicionais:</span> {itemData.extras.map(e => extractName(e)).join(', ')}
              </p>
            )}

            {/* Custom Ingredients */}
            {itemData.customIngredients && itemData.customIngredients.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Customizações:</span>{' '}
                {itemData.customIngredients.map(i => extractName(i)).join(', ')}
              </p>
            )}

            {/* Observações */}
            {itemData.notes && (
              <p className="text-xs text-muted-foreground italic">
                <span className="font-medium">Obs:</span> {itemData.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preço */}
      {totalPrice && <span className="font-semibold">{formatPrice(totalPrice)}</span>}
    </div>
  );
};

/**
 * Renderiza para IMPRESSÃO - Formato compacto e otimizado para térmica
 */
export const renderPrintItem = (props: OrderItemProps): string => {
  const { productName, quantity, size, itemData } = props;

  let html = `
    <div style="margin-bottom: 12px; font-size: 14px; border-bottom: 1px dotted #333; padding-bottom: 8px;">
      <div style="font-weight: bold; margin-bottom: 4px;">
        ${quantity}x ${productName}${size ? ` (${size})` : ''}
      </div>
  `;

  if (itemData) {
    // Pizza Type
    if (itemData.pizzaType) {
      html += `<div style="margin-left: 8px; font-size: 12px;">Tipo: ${formatPizzaType(itemData.pizzaType)}</div>`;
    }

    // Sabores Simples
    if (itemData.sabor1 && !itemData.comboPizzas?.length) {
      html += `<div style="margin-left: 8px; font-size: 12px;">Sabor: ${extractName(itemData.sabor1)}</div>`;
      if (itemData.sabor2) {
        html += `<div style="margin-left: 8px; font-size: 12px;">Sabor 2: ${extractName(itemData.sabor2)}</div>`;
      }
    }

    // Meia-Meia
    if (itemData.halfOne || itemData.halfTwo) {
      html += `<div style="margin-left: 8px; font-size: 12px;">
        Meia: ${extractName(itemData.halfOne)} | ${extractName(itemData.halfTwo)}
      </div>`;
    }

    // Combo Pizzas
    if (itemData.comboPizzas && itemData.comboPizzas.length > 0) {
      html += `<div style="margin-left: 8px; font-size: 12px; margin-top: 4px;">Pizzas:</div>`;
      itemData.comboPizzas.forEach((pizza, idx) => {
        html += `<div style="margin-left: 16px; font-size: 11px;">
          • ${pizza.pizzaName}${pizza.isHalfHalf ? ` (${extractName(pizza.halfOne)} | ${extractName(pizza.halfTwo)})` : ''}
        </div>`;
      });
    }

    // Border
    if (itemData.border) {
      html += `<div style="margin-left: 8px; font-size: 12px;">Borda: ${extractName(itemData.border)}</div>`;
    }

    // Drink
    if (itemData.drink) {
      html += `<div style="margin-left: 8px; font-size: 12px;">Bebida: ${extractName(itemData.drink)}</div>`;
    }

    // Extras
    if (itemData.extras && itemData.extras.length > 0) {
      html += `<div style="margin-left: 8px; font-size: 12px;">+ ${itemData.extras.map(e => extractName(e)).join(', ')}</div>`;
    }

    // Custom Ingredients
    if (itemData.customIngredients && itemData.customIngredients.length > 0) {
      html += `<div style="margin-left: 8px; font-size: 12px;">Custom: ${itemData.customIngredients.map(i => extractName(i)).join(', ')}</div>`;
    }

    // Notes
    if (itemData.notes) {
      html += `<div style="margin-left: 8px; font-size: 11px; font-style: italic; color: #666;">Obs: ${itemData.notes}</div>`;
    }
  }

  html += `</div>`;
  return html;
};

/**
 * Renderiza formato COMPACTO - Uma linha por item
 */
export const renderCompactItem = (props: OrderItemProps): string => {
  const { productName, quantity, size, itemData } = props;

  let compact = `${quantity}x ${productName}`;

  if (size) {
    compact += ` (${size})`;
  }

  if (itemData) {
    const details: string[] = [];

    if (itemData.halfOne) {
      details.push(`${extractName(itemData.halfOne)}|${extractName(itemData.halfTwo)}`);
    } else if (itemData.sabor1) {
      details.push(extractName(itemData.sabor1));
    }

    if (itemData.drink) {
      details.push(`Bebida: ${extractName(itemData.drink)}`);
    }

    if (itemData.border) {
      details.push(`Borda: ${extractName(itemData.border)}`);
    }

    if (itemData.extras?.length) {
      details.push(`+${itemData.extras.map(e => extractName(e)).join(', ')}`);
    }

    if (details.length > 0) {
      compact += ` [${details.join(' • ')}]`;
    }
  }

  return compact;
};

/**
 * Componente React para Dashboard
 */
export function OrderItemDetails(props: OrderItemProps) {
  return <>{renderDashboardItem(props)}</>;
}

/**
 * Componente para usar em lista de itens
 */
export function OrderItemsList({ items }: { items: OrderItemProps[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <OrderItemDetails key={index} {...item} />
      ))}
    </div>
  );
}
