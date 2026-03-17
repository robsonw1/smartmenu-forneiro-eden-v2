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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex items-center gap-3 flex-1">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-shrink-0"
                >
                  <Download className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-primary-foreground text-sm">
                    Instale nosso App
                  </p>
                  <p className="text-xs text-primary-foreground/80">
                    Acesso rápido no seu menu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="px-4 py-2 bg-white text-primary rounded-md font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInstalling ? 'Instalando...' : 'Instalar'}
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-primary-foreground hover:bg-primary/20 p-1 rounded-md transition-colors"
                  title="Dispensar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
