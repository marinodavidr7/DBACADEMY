import React, { Suspense, lazy, useState } from 'react';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Code2,
  Gift,
  GraduationCap,
  Home,
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
  UserCircle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RedeemGiftCardModal } from './components/RedeemGiftCardModal';
import { BrandLogo } from './components/ui/BrandLogo';
import { PageContainer } from './components/ui/PageContainer';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { FIREBASE_AUTH_SETTINGS_URL } from './firebase';
import { LANGUAGE_LABELS } from './i18n/translations';
import type { AppView, Language } from './types';

const CatalogView = lazy(() =>
  import('./components/CatalogView').then((m) => ({ default: m.CatalogView }))
);
const CourseDetailView = lazy(() =>
  import('./components/CourseDetailView').then((m) => ({ default: m.CourseDetailView }))
);
const CoursePlayerView = lazy(() =>
  import('./components/CoursePlayerView').then((m) => ({ default: m.CoursePlayerView }))
);
const InstructorDashboard = lazy(() =>
  import('./components/InstructorDashboard').then((m) => ({ default: m.InstructorDashboard }))
);
const ForumView = lazy(() =>
  import('./components/ForumView').then((m) => ({ default: m.ForumView }))
);
const CertificatesView = lazy(() =>
  import('./components/CertificatesView').then((m) => ({ default: m.CertificatesView }))
);
const CalendarTasksView = lazy(() =>
  import('./components/CalendarTasksView').then((m) => ({ default: m.CalendarTasksView }))
);
const SecurityCloudView = lazy(() =>
  import('./components/SecurityCloudView').then((m) => ({ default: m.SecurityCloudView }))
);
const ApiIntegrationsView = lazy(() =>
  import('./components/ApiIntegrationsView').then((m) => ({ default: m.ApiIntegrationsView }))
);
const UserAccountView = lazy(() =>
  import('./components/UserAccountView').then((m) => ({ default: m.UserAccountView }))
);

const ViewSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Cargando sección">
    <div className="h-32 sm:h-40 rounded-xl bg-slate-200/80 dark:bg-slate-800/70" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="h-44 rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
      <div className="h-44 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 hidden sm:block" />
      <div className="h-44 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 hidden lg:block" />
    </div>
  </div>
);

const AppShell: React.FC = () => {
  const {
    user,
    isAdmin,
    theme,
    language,
    activeView,
    setActiveView,
    setSelectedCourseId,
    zenMode,
    setWorkspaceRole,
    unreadCount,
    connectedDevicesCount,
    wsConnected,
    toggleTheme,
    setLanguage,
    signInWithGoogle,
    logout,
    authError,
    clearAuthError,
    lemonSqueezyBanner,
    clearLemonSqueezyBanner,
    t,
  } = usePlatform();

  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
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
    { id: 'landing', label: t('navHome'), icon: Home },
    { id: 'catalog', label: t('navCatalog'), icon: BookOpen },
    { id: 'learning', label: t('navLearning'), icon: GraduationCap },
    ...(isAdmin ? [{ id: 'instructor' as AppView, label: t('navInstructor'), icon: LayoutDashboard }] : []),
    { id: 'forums', label: t('navForums'), icon: MessageSquare },
    { id: 'certificates', label: t('navCertificates'), icon: Award },
    { id: 'calendar', label: t('navCalendar'), icon: Calendar },
    { id: 'security', label: t('navSecurity'), icon: Shield },
    { id: 'integrations', label: t('navIntegrations'), icon: Code2 },
  ];

  const handleSelectNav = (view: AppView) => {
    const apply = () => {
      setActiveView(view);
      if (view === 'instructor') setWorkspaceRole('instructor');
      else if (view === 'learning') setWorkspaceRole('student');
      setMobileMenuOpen(false);
    };

    const docWithTransition = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (!shouldReduceMotion && typeof docWithTransition.startViewTransition === 'function') {
      docWithTransition.startViewTransition(apply);
    } else {
      apply();
    }
  };

  if (activeView === 'landing') {
    return (
      <>
        <LandingPage
          onExplore={() => handleSelectNav('catalog')}
          onSelectCourse={(courseId) => {
            setSelectedCourseId(courseId);
            handleSelectNav('course-detail');
          }}
          onOpenLearning={() => handleSelectNav('learning')}
          onSignIn={async () => {
            await signInWithGoogle();
          }}
        />
        <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        <OfflineIndicator message={t('offlineBanner')} />
      </>
    );
  }

  const isZenActive = zenMode && activeView === 'learning';

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden overflow-x-hidden bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] flex">
      {/* Desktop Sidebar (Collapsible Rail, hidden in Zen Mode) */}
      {!isZenActive && (
        <aside
          className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-[100dvh] border-r border-[var(--dba-border)] bg-[var(--dba-bg-surface)] transition-[width] duration-200 ease-out z-40 shrink-0 ${
            sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-56'
          }`}
        >
          <div
            className={`h-14 border-b border-[var(--dba-border)] flex items-center shrink-0 ${
              sidebarCollapsed ? 'justify-center px-1.5 gap-1' : 'justify-between px-3'
            }`}
          >
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => handleSelectNav('catalog')}
                className="text-left min-w-0 flex items-center"
              >
                <BrandLogo size="sm" showWordmark={true} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectNav('catalog')}
                title={t('brand')}
                aria-label={t('brand')}
                className="flex items-center justify-center shrink-0"
              >
                <BrandLogo size="xs" showWordmark={false} />
              </button>
            )}

            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Retraer barra lateral'}
              title={sidebarCollapsed ? 'Expandir menú' : 'Retraer menú'}
              className={`rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0 ${
                sidebarCollapsed ? 'p-1' : 'p-1.5'
              }`}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-2 py-2.5 space-y-0.5 overflow-y-auto overflow-x-hidden">
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
                  className={`w-full flex items-center rounded-lg py-2 text-[13px] font-medium transition-colors whitespace-nowrap min-h-[40px] ${
                    sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                  } ${
                    active
                      ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] font-semibold'
                      : 'text-[var(--dba-text-secondary)] hover:bg-stone-100 dark:hover:bg-zinc-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div
            className={`border-t border-slate-200 dark:border-slate-800 space-y-2 ${
              sidebarCollapsed ? 'p-2 flex flex-col items-center' : 'p-3'
            }`}
          >
            {!sidebarCollapsed && user && (
              <button
                type="button"
                onClick={() => handleSelectNav('account')}
                className="w-full text-left text-xs text-slate-600 dark:text-slate-300 space-y-1 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                title="Mi cuenta"
              >
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                  {user.displayName || user.email}
                </p>
                <p className="tabular-nums text-slate-500 dark:text-slate-300">
                  {connectedDevicesCount} {t('devicesConnected')} · {wsConnected ? 'WS' : 'Local'}
                </p>
              </button>
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
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectNav('account')}
                      title="Mi cuenta"
                      aria-label="Mi cuenta"
                      className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                    >
                      <UserCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      title={t('signOut')}
                      aria-label={t('signOut')}
                      className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    title={t('signInGoogle')}
                    aria-label={t('signInGoogle')}
                    className="w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                  >
                    <LogIn className="w-4 h-4" />
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
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] min-h-[40px]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t('signInGoogle')}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-[100dvh] lg:overflow-y-auto overflow-x-clip">
        {/* Clean 3-Zone Top Bar (hidden in Zen Mode) */}
        {!isZenActive && (
          <header className="sticky top-0 z-30 border-b border-[var(--dba-border)] bg-[var(--dba-bg-surface)]/95 backdrop-blur-xs safe-pt px-4 sm:px-5 flex items-center justify-between gap-3 min-h-[54px]">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
                className="lg:hidden -ml-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleSelectNav('catalog')}
                className="lg:hidden flex items-center min-h-[44px] shrink-0"
              >
                <BrandLogo size="sm" showWordmark={true} />
              </button>
              <span className="hidden lg:inline text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                {sidebarCollapsed ? `${t('brand')} · ` : ''}
                {navItems.find((n) => n.id === activeView)?.label || 'Programa del curso'}
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
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleSelectNav('instructor')}
                  className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
                >
                  {t('navInstructor')}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSelectNav('calendar')}
                className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
              >
                {t('navCalendar')}
              </button>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRedeemOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 text-xs font-semibold text-[var(--dba-accent-ink)] transition-colors whitespace-nowrap min-h-[40px]"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Canjear código</span>
              </button>
              <PWAInstallButton label={t('installApp')} />
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label={t('notifications')}
                className="relative px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="ml-1 text-[11px] font-mono tabular-nums font-semibold text-[var(--dba-accent-ink)]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Administrador</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectNav('account')}
                    title="Mi cuenta"
                    aria-label="Mi cuenta"
                    className="inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border border-[var(--dba-border)] text-xs font-medium text-[var(--dba-text-primary)] hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors min-w-[44px] min-h-[44px]"
                  >
                    <UserCircle className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Mi cuenta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    title={t('signOut')}
                    aria-label={t('signOut')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border border-[var(--dba-border)] text-xs font-medium text-[var(--dba-text-primary)] hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors min-w-[44px] min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{t('signOut')}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3.5 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t('signInGoogle')}</span>
                  <span className="sm:hidden">Entrar</span>
                </button>
              )}
            </div>
          </header>
        )}

        <main
          className={`flex-1 min-w-0 w-full ${
            isZenActive ? 'safe-pb' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-6'
          }`}
        >
          <PageContainer
            className={`transition-all duration-200 ${
              isZenActive ? 'py-3 sm:py-4 max-w-none' : 'py-3 sm:py-4'
            }`}
          >
            {authError && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <span className="block break-words">{authError}</span>
                    {authError.includes('Authorized domains') && (
                      <a
                        href={FIREBASE_AUTH_SETTINGS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold underline hover:text-red-900 dark:hover:text-red-100"
                      >
                        Abrir Firebase Console → Authentication → Settings
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearAuthError}
                  aria-label="Cerrar aviso"
                  className="min-w-[36px] min-h-[36px] rounded hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {lemonSqueezyBanner && (
              <div
                className={`mb-5 rounded-xl border p-3.5 text-xs flex items-center justify-between gap-3 ${
                  lemonSqueezyBanner.status === 'success'
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : lemonSqueezyBanner.status === 'error'
                      ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200'
                      : 'border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200'
                }`}
              >
                <span className="font-medium">{lemonSqueezyBanner.message}</span>
                <button
                  type="button"
                  onClick={clearLemonSqueezyBanner}
                  aria-label="Cerrar notificación de pago"
                  className="min-w-[32px] min-h-[32px] rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Suspense fallback={<ViewSkeleton />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeView}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                  className="min-w-0"
                >
                  {activeView === 'catalog' && <CatalogView />}
                  {activeView === 'course-detail' && <CourseDetailView />}
                  {activeView === 'learning' && <CoursePlayerView />}
                  {activeView === 'instructor' && <InstructorDashboard />}
                  {activeView === 'forums' && <ForumView />}
                  {activeView === 'certificates' && <CertificatesView />}
                  {activeView === 'calendar' && <CalendarTasksView />}
                  {activeView === 'security' && <SecurityCloudView />}
                  {activeView === 'integrations' && <ApiIntegrationsView />}
                  {activeView === 'account' && <UserAccountView />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </PageContainer>
        </main>
      </div>

      {/* Native Mobile Bottom Tab Bar (hidden on lg+ and in Zen Mode) */}
      {!isZenActive && (
        <nav
          aria-label="Navegación inferior"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--dba-border)] bg-[var(--dba-bg-surface)]/95 backdrop-blur-md safe-pb safe-px"
        >
          <div className="grid grid-cols-4 h-14 max-w-md mx-auto">
            {[
              { id: 'catalog' as AppView, label: 'Catálogo', icon: BookOpen, match: ['catalog', 'course-detail'] },
              { id: 'learning' as AppView, label: 'Aprender', icon: GraduationCap, match: ['learning'] },
              { id: 'certificates' as AppView, label: 'Diplomas', icon: Award, match: ['certificates'] },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.match.includes(activeView);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectNav(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 transition-colors ${
                    isActive
                      ? 'text-[var(--dba-accent-ink)] font-semibold'
                      : 'text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[11px] leading-tight truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 transition-colors ${
                mobileMenuOpen
                  ? 'text-[var(--dba-accent-ink)] font-semibold'
                  : 'text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
              }`}
            >
              <Menu className="w-5 h-5 shrink-0" />
              <span className="text-[11px] leading-tight">Más</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={shouldReduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: '-100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 28, stiffness: 300 }
              }
              className="w-72 max-w-[85vw] bg-[var(--dba-bg-surface)] h-full flex flex-col border-r border-[var(--dba-border)] safe-pt safe-pb"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--dba-border)] shrink-0">
                <BrandLogo size="sm" showWordmark={true} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="min-w-[44px] min-h-[44px] -mr-2 rounded-lg text-[var(--dba-text-secondary)] hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-center"
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
                          ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] font-semibold'
                          : 'text-[var(--dba-text-primary)] hover:bg-stone-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="px-3 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setRedeemOpen(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-[var(--dba-accent-ink)] min-h-[44px]"
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Canjear Gift Card</span>
                </button>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => void setLanguage(e.target.value as Language)}
                    aria-label="Idioma"
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-800 dark:text-slate-200 min-h-[44px]"
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
                    className="min-w-[44px] min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center"
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
      {redeemOpen && (
        <RedeemGiftCardModal
          onClose={() => setRedeemOpen(false)}
          onEnrolled={(courseId) => {
            setRedeemOpen(false);
            setSelectedCourseId(courseId);
            setActiveView('learning');
          }}
          onContinuePartialCheckout={(course) => {
            setRedeemOpen(false);
            setSelectedCourseId(course.id);
            setActiveView('course-detail');
          }}
        />
      )}
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
