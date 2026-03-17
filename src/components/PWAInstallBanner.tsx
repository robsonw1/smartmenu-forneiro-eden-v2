import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PWAInstallBanner() {
  const { canInstall, isInstalling, triggerInstall, isInstalled } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Mostrar banner se pode instalar e não foi dismissado
    if (canInstall && !isDismissed && !isInstalled) {
      // Delay pequenininho para animação mais suave
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isDismissed, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Permitir mostrar novamente após 1 dia
    setTimeout(() => setIsDismissed(false), 24 * 60 * 60 * 1000);
  };

  const handleInstall = async () => {
    await triggerInstall();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-[60] md:bottom-6 md:right-6 max-w-sm w-auto"
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-2xl overflow-hidden border border-primary/40 backdrop-blur-sm">
            {/* Conteúdo do Toast */}
            <div className="flex items-center gap-3 p-4">
              {/* Ícone com animação */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0"
              >
                <Download className="w-5 h-5 text-primary-foreground" />
              </motion.div>

              {/* Texto */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-semibold text-primary-foreground text-sm leading-tight">
                  Instale nosso App
                </p>
                <p className="text-xs text-primary-foreground/80 leading-tight">
                  Acesso rápido no seu dispositivo
                </p>
              </div>

              {/* Botão Instalar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstall}
                disabled={isInstalling}
                className="px-3 py-1.5 bg-white text-primary rounded-lg font-semibold text-xs hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
              >
                {isInstalling ? 'Instalando...' : 'Instalar'}
              </motion.button>

              {/* Botão Fechar */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-primary-foreground hover:bg-primary/20 p-1 rounded-md transition-colors"
                title="Dispensar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de progresso (opcional) */}
            {isInstalling && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2 }}
                className="h-1 bg-white/30 origin-left"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
