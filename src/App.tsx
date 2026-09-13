import { useState } from 'react'
import {
  LayoutDashboard,
  ListChecks,
  Heart,
  DollarSign,
  GitBranch,
  CalendarDays,
  Box,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { SheepRegistry } from '@/components/sheep/SheepRegistry'
import { SheepProfile } from '@/components/sheep/SheepProfile'
import { BreedingPage } from '@/components/breeding/BreedingPage'
import { HealthPage } from '@/components/health/HealthPage'
import { FinancesPage } from '@/components/finances/FinancesPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { CalendarPage } from '@/components/calendar/CalendarPage'
import { PensPage } from '@/components/pens/PensPage'

type View = 'dashboard' | 'registry' | 'health' | 'finances' | 'breeding' | 'kojce' | 'kalendarz' | 'settings'

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel główny', icon: LayoutDashboard },
  { id: 'registry', label: 'Rejestr', icon: ListChecks },
  { id: 'health', label: 'Zdrowie', icon: Heart },
  { id: 'finances', label: 'Finanse', icon: DollarSign },
  { id: 'breeding', label: 'Rozród', icon: GitBranch },
  { id: 'kojce', label: 'Kojce', icon: Box },
  { id: 'kalendarz', label: 'Kalendarz', icon: CalendarDays },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
]

// Quick mobile bottom navigation items
const mobileBottomNav: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'registry', label: 'Rejestr', icon: ListChecks },
  { id: 'health', label: 'Zdrowie', icon: Heart },
  { id: 'finances', label: 'Finanse', icon: DollarSign },
]

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedSheepId, setSelectedSheepId] = useState<string | null>(null)
  const [returnView, setReturnView] = useState<View | null>(null)

  // Navigate to a view, clearing any profile selection
  const navigateTo = (view: View) => {
    setCurrentView(view)
    setSelectedSheepId(null)
    setReturnView(null)
    setMobileMenuOpen(false)
  }

  // Open profile for any sheep from any page
  const handleViewSheep = (id: string) => {
    setReturnView(currentView)
    setSelectedSheepId(id)
  }

  // Back from profile to previous view
  const handleBackFromProfile = () => {
    setSelectedSheepId(null)
    if (returnView) {
      setCurrentView(returnView)
      setReturnView(null)
    }
  }

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background text-foreground">
      {/* Mobile Top Header (Phones / Small screens) */}
      <header className="flex md:hidden h-14 items-center justify-between border-b border-border bg-card px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo dorper.pl"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-600/30 shadow-sm"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">dorper.pl</h1>
            <p className="text-[10px] text-muted-foreground font-medium">System hodowlany</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
          aria-label={mobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out md:static md:z-auto shadow-2xl md:shadow-none',
          mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0',
          sidebarCollapsed ? 'md:w-16' : 'md:w-60'
        )}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo dorper.pl"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-emerald-600/40 shadow-sm transition-transform hover:scale-105"
            />
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="animate-fade-in min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-tight text-foreground truncate">dorper.pl</h1>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium truncate">System hodowlany v1.0</p>
              </div>
            )}
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-700 font-semibold border border-emerald-600/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-emerald-600')} />
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <span className="animate-fade-in truncate">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden md:block border-t border-border p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title={sidebarCollapsed ? 'Rozwiń pasek' : 'Zwiń pasek'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="animate-fade-in p-3 sm:p-4 md:p-6 pb-24 md:pb-6 max-w-full">
          {selectedSheepId ? (
            <SheepProfile
              sheepId={selectedSheepId}
              onBack={handleBackFromProfile}
            />
          ) : (
            <>
              {/* Dashboard */}
              {currentView === 'dashboard' && <Dashboard onViewSheep={handleViewSheep} />}

              {/* Registry */}
              {currentView === 'registry' && (
                <SheepRegistry onViewSheep={handleViewSheep} />
              )}

              {/* Full pages */}
              {currentView === 'health' && <HealthPage onViewSheep={handleViewSheep} />}
              {currentView === 'finances' && <FinancesPage onViewSheep={handleViewSheep} />}
              {currentView === 'breeding' && <BreedingPage onViewSheep={handleViewSheep} />}
              {currentView === 'kalendarz' && <CalendarPage onViewSheep={handleViewSheep} />}
              {currentView === 'kojce' && <PensPage onViewSheep={handleViewSheep} />}

              {/* Settings */}
              {currentView === 'settings' && <SettingsPage />}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Phones / Screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileBottomNav.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-emerald-500 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive && 'text-emerald-500')} />
              <span>{item.label}</span>
            </button>
          )
        })}
        {/* "Więcej" button triggers drawer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>Więcej</span>
        </button>
      </nav>
    </div>
  )
}

export default App
