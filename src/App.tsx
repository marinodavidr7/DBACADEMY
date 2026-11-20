import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  Code2,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ApiIntegrationsView } from './components/ApiIntegrationsView';
import { CalendarTasksView } from './components/CalendarTasksView';
import { CatalogView } from './components/CatalogView';
import { CertificatesView } from './components/CertificatesView';
import { CoursePlayerView } from './components/CoursePlayerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ForumView } from './components/ForumView';
import { InstructorDashboard } from './components/InstructorDashboard';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SecurityCloudView } from './components/SecurityCloudView';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { LANGUAGE_LABELS } from './i18n/translations';
import type { AppView, Language } from './types';

const AppShell: React.FC = () => {
  const {
    user,
    theme,
    language,
    activeView,
    setActiveView,
    setWorkspaceRole,
    unreadCount,
    connectedDevicesCount,
    wsConnected,
    toggleTheme,
    setLanguage,
    signInWithGoogle,
    logout,
    t,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'catalog', label: t('navCatalog'), icon: BookOpen },
    { id: 'learning', label: t('navLearning'), icon: GraduationCap },
    { id: 'instructor', label: t('navInstructor'), icon: LayoutDashboard },
    { id: 'forums', label: t('navForums'), icon: MessageSquare },
    { id: 'certificates', label: t('navCertificates'), icon: Award },
    { id: 'calendar', label: t('navCalendar'), icon: Calendar },
    { id: 'security', label: t('navSecurity'), icon: Shield },
    { id: 'integrations', label: t('navIntegrations'), icon: Code2 },
  ];

  const handleSelectNav = (view: AppView) => {
    setActiveView(view);
    if (view === 'instructor') setWorkspaceRole('instructor');
    else if (view === 'learning') setWorkspaceRole('student');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624]">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSelectNav('catalog')}
            className="text-left block"
          >
            <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {t('brand')}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('tagline')}
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[42px] ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {user && (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {user.displayName || user.email}
              </p>
              <p className="tabular-nums">
                {connectedDevicesCount} {t('devicesConnected')} · {wsConnected ? 'WS' : 'Local'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => void setLanguage(e.target.value as Language)}
              aria-label="Idioma"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[40px]"
            >
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void toggleTheme()}
              aria-label="Cambiar tema"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('signOut')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('signInGoogle')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Clean 3-Zone Top Bar (<= 56px height for mobile sticky cap compliance) */}
        <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F1624]/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="lg:hidden text-base font-bold text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0">
              {t('brand')}
            </span>
            <span className="hidden lg:inline text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              {navItems.find((n) => n.id === activeView)?.label}
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => handleSelectNav('catalog')}
              className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t('navCatalog')}
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav('learning')}
              className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t('navLearning')}
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav('instructor')}
              className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t('navInstructor')}
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav('calendar')}
              className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
            >
              {t('navCalendar')}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton label={t('installApp')} />
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label={t('notifications')}
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="ml-1 text-[11px] font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                  {unreadCount}
                </span>
              )}
            </button>

            {!user && (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('signInGoogle')}</span>
                <span className="sm:hidden">Google</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeView === 'catalog' && <CatalogView />}
              {activeView === 'learning' && <CoursePlayerView />}
              {activeView === 'instructor' && <InstructorDashboard />}
              {activeView === 'forums' && <ForumView />}
              {activeView === 'certificates' && <CertificatesView />}
              {activeView === 'calendar' && <CalendarTasksView />}
              {activeView === 'security' && <SecurityCloudView />}
              {activeView === 'integrations' && <ApiIntegrationsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-72 max-w-[85vw] bg-white dark:bg-[#0F1624] h-full flex flex-col border-r border-slate-200 dark:border-slate-800"
            >
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                {t('brand')}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => void setLanguage(e.target.value as Language)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 min-h-[44px]"
                >
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGE_LABELS[code]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void toggleTheme()}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-[44px]"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('signOut')}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <OfflineIndicator message={t('offlineBanner')} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <PlatformProvider>
        <AppShell />
      </PlatformProvider>
    </ErrorBoundary>
  );
}
