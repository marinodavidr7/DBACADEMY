import React, { useState } from 'react';
import {
  AlertCircle,
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
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
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
    isAdmin,
    theme,
    language,
    activeView,
    setActiveView,
    zenMode,
    setWorkspaceRole,
    unreadCount,
    connectedDevicesCount,
    wsConnected,
    toggleTheme,
    setLanguage,
    signInWithGoogle,
    signInAsDemo,
    signInAsAdmin,
    logout,
    authError,
    clearAuthError,
    t,
  } = usePlatform();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('catedra_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('catedra_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

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

  const isZenActive = zenMode && activeView === 'learning';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar (Collapsible Rail, hidden in Zen Mode) */}
      {!isZenActive && (
        <aside
          className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] transition-[width] duration-200 ease-out z-40 ${
            sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
          }`}
        >
        <div
          className={`h-14 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0 ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => handleSelectNav('catalog')}
              className="text-left min-w-0"
            >
              <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap truncate">
                {t('brand')}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {t('tagline')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Retraer barra lateral'}
            title={sidebarCollapsed ? 'Expandir menú' : 'Retraer menú'}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-label={item.label}
                className={`w-full flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[42px] ${
                  sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div
          className={`border-t border-slate-200 dark:border-slate-800 space-y-2.5 ${
            sidebarCollapsed ? 'p-2.5 flex flex-col items-center' : 'p-4'
          }`}
        >
          {!sidebarCollapsed && user && (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {user.displayName || user.email}
              </p>
              <p className="tabular-nums">
                {connectedDevicesCount} {t('devicesConnected')} · {wsConnected ? 'WS' : 'Local'}
              </p>
            </div>
          )}

          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  const codes: Language[] = ['es', 'en', 'fr', 'pt'];
                  const next = codes[(codes.indexOf(language) + 1) % codes.length];
                  void setLanguage(next);
                }}
                title={`Idioma: ${LANGUAGE_LABELS[language]}`}
                aria-label="Cambiar idioma"
                className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] font-mono font-semibold uppercase text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                {language}
              </button>

              <button
                type="button"
                onClick={() => void toggleTheme()}
                title="Cambiar tema"
                aria-label="Cambiar tema"
                className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  title={t('signOut')}
                  aria-label={t('signOut')}
                  className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInAsAdmin()}
                  title="Entrar como Administrador"
                  aria-label="Entrar como Administrador"
                  className="w-10 h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
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
                <div className="space-y-2">
                  {isAdmin && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Administrador</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('signOut')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void signInAsAdmin()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors min-h-[40px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Admin (David)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t('signInGoogle')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void signInAsDemo()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                  >
                    <span>Modo Demo</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ease-out ${
          isZenActive ? 'lg:pl-0' : sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Clean 3-Zone Top Bar (hidden in Zen Mode for maximum viewport) */}
        {!isZenActive && (
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
              {sidebarCollapsed ? `${t('brand')} · ` : ''}
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

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Administrador</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  title={t('signOut')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('signOut')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void signInAsAdmin()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                  title="Acceso directo como Administrador de la plataforma"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span className="hidden sm:inline">Admin (David)</span>
                  <span className="sm:hidden">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('signInGoogle')}</span>
                  <span className="sm:hidden">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => void signInAsDemo()}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                >
                  <span>Modo Demo</span>
                </button>
              </div>
            )}
          </div>
          </header>
        )}

        <main
          className={`flex-1 w-full mx-auto transition-all duration-200 ${
            isZenActive ? 'p-4 sm:p-6 max-w-5xl' : 'p-4 sm:p-6 lg:p-8 max-w-[1360px]'
          }`}
        >
          {authError && (
            <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
              <button
                type="button"
                onClick={clearAuthError}
                aria-label="Cerrar aviso"
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
