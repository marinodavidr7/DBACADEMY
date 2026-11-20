import React from 'react';
import { Bell, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ open, onClose }) => {
  const { notifications, markAllNotificationsRead, t } = usePlatform();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-md bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 h-full flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('notifications')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('markAllRead')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t('noNotifications')}
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 ${n.read ? 'opacity-70' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="uppercase font-medium text-blue-600 dark:text-blue-400">
                        {n.category}
                      </span>
                      <span className="font-mono tabular-nums">
                        {new Date(n.createdAtIso).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
