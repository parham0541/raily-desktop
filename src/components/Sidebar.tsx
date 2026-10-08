import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  LayoutDashboard,
  Moon,
  Settings,
  Target,
} from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import railyIcon from '../assets/icon.png'

type SidebarProps = {
  activePage: string
  onNavigate: (page: string) => void
  eventCount?: number
}

type MenuItem = {
  id: string
  label: string
  icon: typeof LayoutDashboard
  badge?: number
}

function Sidebar({
  activePage,
  onNavigate,
  eventCount = 0,
}: SidebarProps) {
  const { t } = useLanguage()

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t.navigation.dashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'todo',
      label: t.navigation.todo,
      icon: CheckSquare,
    },
    {
      id: 'goals',
      label: t.navigation.goals,
      icon: Target,
    },
    {
      id: 'activities',
      label: t.navigation.activities,
      icon: Activity,
    },
    {
      id: 'calendar',
      label: t.navigation.calendar,
      icon: CalendarDays,
    },
    {
      id: 'sleep',
      label: t.navigation.sleep,
      icon: Moon,
    },
    {
      id: 'mind',
      label: t.navigation.mind,
      icon: Brain,
    },
    {
      id: 'reports',
      label: t.navigation.reports,
      icon: BarChart3,
    },
    {
      id: 'events',
      label: t.navigation.events,
      icon: Bell,
      badge: eventCount,
    },
  ]

  const isSettingsActive =
    activePage === 'settings'

  const handleNavigate = (page: string) => {
    onNavigate(page)
  }

  return (
    <aside
      dir="inherit"
      className="
        group/sidebar
        relative
        flex
        h-screen
        w-[270px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-slate-200/80
        bg-white
        transition-colors
        duration-300
        dark:border-[#1a2d45]
        dark:bg-[#091625]
      "
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-blue-500/[0.04]
          blur-3xl
          transition-all
          duration-700
          group-hover/sidebar:bg-blue-500/[0.07]
          dark:bg-blue-400/[0.035]
          dark:group-hover/sidebar:bg-blue-400/[0.06]
        "
      />

      {/* Brand */}
      <div
        className="
          relative
          border-b
          border-slate-100
          px-4
          py-4
          dark:border-[#172a42]
        "
      >
        <button
          type="button"
          onClick={() =>
            handleNavigate('dashboard')
          }
          aria-label="Raily Dashboard"
          className="
            group/brand
            flex
            w-full
            items-center
            gap-3
            rounded-2xl
            p-2
            text-start
            outline-none
            transition-all
            duration-300
            hover:bg-slate-50
            focus-visible:ring-2
            focus-visible:ring-blue-500/50
            dark:hover:bg-[#0e2034]
          "
        >
          {/* App Icon */}
          <div
            className="
              relative
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-[15px]
              bg-gradient-to-br
              from-blue-500
              to-blue-700
              shadow-lg
              shadow-blue-600/20
              transition-all
              duration-300
              group-hover/brand:scale-105
              group-hover/brand:rotate-1
              group-hover/brand:shadow-xl
              group-hover/brand:shadow-blue-600/25
              dark:from-blue-500
              dark:to-blue-600
            "
          >
            <span
              aria-hidden="true"
              className="
                absolute
                -left-10
                top-0
                h-full
                w-8
                rotate-[25deg]
                bg-white/20
                blur-sm
                transition-all
                duration-700
                group-hover/brand:left-[120%]
              "
            />

            <img
              src={railyIcon}
              alt="Raily"
              className="
                relative
                z-10
                h-9
                w-9
                object-contain
                drop-shadow-sm
              "
            />
          </div>

          {/* Brand text */}
          <div className="min-w-0 flex-1">
            <div
              className="
                text-[17px]
                font-bold
                tracking-[-0.02em]
                text-slate-900
                transition-colors
                duration-200
                group-hover/brand:text-blue-600
                dark:text-slate-100
                dark:group-hover/brand:text-blue-400
              "
            >
              Raily
            </div>

            <div
              className="
                mt-0.5
                text-[11px]
                font-medium
                tracking-wide
                text-slate-400
                dark:text-slate-500
              "
            >
              Life Planner
            </div>
          </div>

          <ChevronRight
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            className="
              shrink-0
              text-slate-300
              opacity-0
              transition-all
              duration-200
              group-hover/brand:translate-x-0.5
              group-hover/brand:opacity-100
              dark:text-slate-600
            "
          />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="
          relative
          flex-1
          overflow-y-auto
          px-3
          py-5
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-slate-200
          dark:scrollbar-thumb-[#20364f]
        "
      >
        {/* Section title */}
        <div
          className="
            mb-2
            px-3
            text-[10px]
            font-bold
            uppercase
            tracking-[0.12em]
            text-slate-400
            dark:text-slate-600
          "
        >
          {t.navigation.dashboard === 'Dashboard'
            ? 'Workspace'
            : 'منطقه کاری'}
        </div>

        <div className="space-y-1">
          {menuItems.map(
            (item, index) => {
              const Icon = item.icon
              const active =
                activePage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleNavigate(item.id)
                  }
                  aria-current={
                    active ? 'page' : undefined
                  }
                  style={{
                    animationDelay: `${index * 35}ms`,
                  }}
                  className={`
                    group/nav
                    relative
                    flex
                    w-full
                    items-center
                    gap-3
                    overflow-hidden
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    outline-none
                    transition-all
                    duration-200
                    animate-[sidebarItemIn_400ms_ease_both]
                    focus-visible:ring-2
                    focus-visible:ring-blue-500/50
                    ${
                      active
                        ? `
                          bg-blue-50
                          text-blue-700
                          dark:bg-blue-500/[0.11]
                          dark:text-blue-400
                        `
                        : `
                          text-slate-500
                          hover:bg-slate-50
                          hover:text-slate-900
                          dark:text-slate-400
                          dark:hover:bg-[#0e2034]
                          dark:hover:text-slate-100
                        `
                    }
                  `}
                >
                  {/* Active indicator */}
                  <span
                    aria-hidden="true"
                    className={`
                      absolute
                      start-0
                      top-1/2
                      h-7
                      w-[3px]
                      -translate-y-1/2
                      rounded-full
                      bg-blue-600
                      transition-all
                      duration-300
                      dark:bg-blue-400
                      ${
                        active
                          ? 'opacity-100'
                          : 'opacity-0'
                      }
                    `}
                  />

                  {/* Hover glow */}
                  <span
                    aria-hidden="true"
                    className={`
                      pointer-events-none
                      absolute
                      inset-0
                      rounded-xl
                      bg-gradient-to-r
                      from-blue-500/[0.05]
                      to-transparent
                      opacity-0
                      transition-opacity
                      duration-200
                      group-hover/nav:opacity-100
                      ${
                        active
                          ? 'opacity-100'
                          : ''
                      }
                    `}
                  />

                  {/* Icon */}
                  <span
                    className={`
                      relative
                      z-10
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      transition-all
                      duration-200
                      ${
                        active
                          ? `
                            bg-blue-100
                            text-blue-600
                            dark:bg-blue-400/10
                            dark:text-blue-400
                          `
                          : `
                            bg-transparent
                            text-slate-400
                            group-hover/nav:scale-105
                            group-hover/nav:text-slate-700
                            dark:text-slate-500
                            dark:group-hover/nav:text-slate-200
                          `
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      strokeWidth={
                        active ? 2.2 : 1.9
                      }
                      aria-hidden="true"
                      className="
                        transition-transform
                        duration-200
                        group-hover/nav:scale-105
                      "
                    />
                  </span>

                  {/* Label */}
                  <span
                    className="
                      relative
                      z-10
                      min-w-0
                      flex-1
                      truncate
                      text-start
                    "
                  >
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.id === 'events' &&
                    eventCount > 0 && (
                      <span
                        aria-label={`${eventCount} events`}
                        className="
                          relative
                          z-10
                          flex
                          h-5
                          min-w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-600
                          px-1.5
                          text-[10px]
                          font-bold
                          text-white
                          shadow-sm
                          shadow-blue-600/20
                          transition-transform
                          duration-200
                          group-hover/nav:scale-105
                          dark:bg-blue-500
                        "
                      >
                        {eventCount}
                      </span>
                    )}
                </button>
              )
            },
          )}
        </div>
      </nav>

      {/* Bottom section */}
      <div
        className="
          relative
          border-t
          border-slate-100
          p-3
          dark:border-[#172a42]
        "
      >
        <button
          type="button"
          onClick={() =>
            handleNavigate('settings')
          }
          aria-current={
            isSettingsActive
              ? 'page'
              : undefined
          }
          className={`
            group/settings
            relative
            flex
            w-full
            items-center
            gap-3
            overflow-hidden
            rounded-xl
            px-3
            py-2.5
            text-sm
            font-medium
            outline-none
            transition-all
            duration-200
            focus-visible:ring-2
            focus-visible:ring-blue-500/50
            ${
              isSettingsActive
                ? `
                  bg-blue-50
                  text-blue-700
                  dark:bg-blue-500/[0.11]
                  dark:text-blue-400
                `
                : `
                  text-slate-500
                  hover:bg-slate-50
                  hover:text-slate-900
                  dark:text-slate-400
                  dark:hover:bg-[#0e2034]
                  dark:hover:text-slate-100
                `
            }
          `}
        >
          <span
            aria-hidden="true"
            className={`
              absolute
              start-0
              top-1/2
              h-7
              w-[3px]
              -translate-y-1/2
              rounded-full
              bg-blue-600
              transition-opacity
              duration-200
              dark:bg-blue-400
              ${
                isSettingsActive
                  ? 'opacity-100'
                  : 'opacity-0'
              }
            `}
          />

          <span
            className={`
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              transition-all
              duration-300
              ${
                isSettingsActive
                  ? `
                    bg-blue-100
                    text-blue-600
                    dark:bg-blue-400/10
                    dark:text-blue-400
                  `
                  : `
                    text-slate-400
                    group-hover/settings:rotate-45
                    group-hover/settings:text-slate-700
                    dark:text-slate-500
                    dark:group-hover/settings:text-slate-200
                  `
              }
            `}
          >
            <Settings
              size={18}
              strokeWidth={
                isSettingsActive ? 2.2 : 1.9
              }
              aria-hidden="true"
            />
          </span>

          <span className="flex-1 text-start">
            {t.common.settings}
          </span>
        </button>

        {/* Version */}
        <div
          className="
            mt-3
            px-3
            text-[10px]
            font-medium
            text-slate-300
            dark:text-slate-700
          "
        >
          Raily · Life Planner
        </div>
      </div>

      <style>{`
        @keyframes sidebarItemIn {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  )
}

export default Sidebar