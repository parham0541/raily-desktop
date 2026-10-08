import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Moon,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'


import Sidebar from './components/Sidebar'

import Todo from './pages/Todo'
import Goals from './pages/Goals'
import Activities from './pages/Activities'
import Calendar from './pages/Calendar'
import Sleep from './pages/Sleep'
import Mind from './pages/Mind'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Reports from './pages/Reports'

import dogHelloGif from './assets/cursor/dog-helllo.gif'

import {
  useLanguage,
} from './i18n/LanguageContext'

import {
  toJalaali,
} from 'jalaali-js'


type Page =
  | 'dashboard'
  | 'todo'
  | 'goals'
  | 'activities'
  | 'calendar'
  | 'sleep'
  | 'mind'
  | 'reports'
  | 'events'
  | 'settings'


/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DashboardTodo = {
  id: number
  title: string
  completed: boolean
  priority: string
  dueDate: string | null
  dueTime: string | null
  status: string
  createdAt: number
  updatedAt: number
}


type DashboardGoal = {
  id: number
  title: string
  description: string | null
  category: string
  progress: number
  startDate: string | null
  targetDate: string | null
  status: string
  createdAt: number
  updatedAt: number
}


type DashboardActivity = {
  id: number
  title: string
  description: string | null
  category: string
  activityDate: string
  startTime: string | null
  endTime: string | null
  duration: number
  completed: boolean
  createdAt: number
  updatedAt: number
}


type DashboardSleep = {
  id: number
  sleepDate: string
  bedtime: string
  wakeTime: string
  duration: number
  quality: number
  note: string | null
  createdAt: number
  updatedAt: number
}


type DashboardEvent = {
  id: number
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location: string | null
  category: string
  reminderMinutes: number | null
  color: string | null
  createdAt: number
  updatedAt: number
}


type DashboardApi = {
  clock: {
    get: () => Promise<{
      timestamp: number
      dateMode: string
    }>
  }

  todos: {
    get: () => Promise<DashboardTodo[]>
  }

  goals: {
    get: () => Promise<DashboardGoal[]>
  }

  activities: {
    get: () => Promise<DashboardActivity[]>
  }

  sleep: {
    get: () => Promise<DashboardSleep[]>
  }

  events: {
    get: () => Promise<DashboardEvent[]>
  }
}


/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeJalaliDate(
  value: string | null | undefined,
) {
  if (!value) {
    return null
  }

  const match = String(value)
    .trim()
    .match(
      /^(\d{4})[-/]?(\d{1,2})[-/]?(\d{1,2})$/,
    )

  if (!match) {
    return null
  }

  return `${match[1]}/${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`
}


function clampPercent(
  value: unknown,
) {
  return Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0,
    ),
  )
}


function formatDuration(
  minutes: number,
  isPersian: boolean,
) {
  const safeMinutes =
    Math.max(
      0,
      Math.round(
        Number(minutes) || 0,
      ),
    )

  const hours =
    Math.floor(
      safeMinutes / 60,
    )

  const remaining =
    safeMinutes % 60

  if (hours === 0) {
    return isPersian
      ? `${remaining} دقیقه`
      : `${remaining} min`
  }

  if (remaining === 0) {
    return isPersian
      ? `${hours} ساعت`
      : `${hours}h`
  }

  return isPersian
    ? `${hours} ساعت و ${remaining} دقیقه`
    : `${hours}h ${remaining}m`
}


function formatTime(
  time: string | null,
  isPersian: boolean,
) {
  if (!time) {
    return isPersian
      ? 'بدون ساعت'
      : 'No time'
  }

  return time
}


function getJalaliKey(
  date: Date,
) {
  const {
    jy,
    jm,
    jd,
  } = toJalaali(date)

  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}


/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon,
  text,
}: {
  icon: ReactNode
  text: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
      <div className="mx-auto w-fit text-slate-300 dark:text-slate-700">
        {icon}
      </div>

      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        {text}
      </p>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  text,
  color,
}: {
  label: string
  value: number
  text: string
  color: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {label}
        </span>

        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {text}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${clampPercent(value)}%` }}
        />
      </div>
    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function Dashboard() {
  const {
    language,
    t,
  } = useLanguage()

  const isPersian =
    language === 'fa'

  const api =
    window.raily as unknown as DashboardApi

  const [
    clockTimestamp,
    setClockTimestamp,
  ] = useState<number | null>(
    null,
  )

  const [
    clockDateMode,
    setClockDateMode,
  ] = useState('system')

  const [
    todos,
    setTodos,
  ] = useState<DashboardTodo[]>(
    [],
  )

  const [
    goals,
    setGoals,
  ] = useState<DashboardGoal[]>(
    [],
  )

  const [
    activities,
    setActivities,
  ] = useState<DashboardActivity[]>(
    [],
  )

  const [
    sleepRecords,
    setSleepRecords,
  ] = useState<DashboardSleep[]>(
    [],
  )

  const [
    events,
    setEvents,
  ] = useState<DashboardEvent[]>(
    [],
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    dataError,
    setDataError,
  ] = useState(false)


  /* ---------------------------------------------------------------------- */
  /* Clock                                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true

    async function loadClock() {
      try {
        const clock =
          await api.clock.get()

        if (!mounted) {
          return
        }

        setClockTimestamp(
          clock.timestamp,
        )

        setClockDateMode(
          clock.dateMode,
        )
      } catch {
        if (mounted) {
          setClockTimestamp(
            Date.now(),
          )
        }
      }
    }

    loadClock()

    const interval =
      window.setInterval(
        loadClock,
        5000,
      )

    return () => {
      mounted = false
      window.clearInterval(
        interval,
      )
    }
  }, [])


  useEffect(() => {
    if (
      clockTimestamp === null
    ) {
      return
    }

    const startedAt =
      Date.now()

    const initialTimestamp =
      clockTimestamp

    const interval =
      window.setInterval(
        () => {
          setClockTimestamp(
            initialTimestamp +
              (
                Date.now() -
                startedAt
              ),
          )
        },
        1000,
      )

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [
    clockTimestamp === null,
  ])


  /* ---------------------------------------------------------------------- */
  /* Database                                                               */
  /* ---------------------------------------------------------------------- */

  async function loadDashboard(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true)
    }

    const results =
      await Promise.allSettled([
        api.todos.get(),
        api.goals.get(),
        api.activities.get(),
        api.sleep.get(),
        api.events.get(),
      ])

    const [
      todoResult,
      goalResult,
      activityResult,
      sleepResult,
      eventResult,
    ] = results

    if (
      todoResult.status ===
      'fulfilled'
    ) {
      setTodos(
        Array.isArray(
          todoResult.value,
        )
          ? todoResult.value
          : [],
      )
    }

    if (
      goalResult.status ===
      'fulfilled'
    ) {
      setGoals(
        Array.isArray(
          goalResult.value,
        )
          ? goalResult.value
          : [],
      )
    }

    if (
      activityResult.status ===
      'fulfilled'
    ) {
      setActivities(
        Array.isArray(
          activityResult.value,
        )
          ? activityResult.value
          : [],
      )
    }

    if (
      sleepResult.status ===
      'fulfilled'
    ) {
      setSleepRecords(
        Array.isArray(
          sleepResult.value,
        )
          ? sleepResult.value
          : [],
      )
    }

    if (
      eventResult.status ===
      'fulfilled'
    ) {
      setEvents(
        Array.isArray(
          eventResult.value,
        )
          ? eventResult.value
          : [],
      )
    }

    setDataError(
      results.some(
        (result) =>
          result.status ===
          'rejected',
      ),
    )

    setLoading(false)
    setRefreshing(false)
  }


  useEffect(() => {
    loadDashboard()

    const interval =
      window.setInterval(
        () =>
          loadDashboard(),
        15000,
      )

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [])


  /* ---------------------------------------------------------------------- */
  /* Dates                                                                  */
  /* ---------------------------------------------------------------------- */

  const now =
    useMemo(
      () =>
        clockTimestamp !== null
          ? new Date(
              clockTimestamp,
            )
          : new Date(),
      [clockTimestamp],
    )


  const todayJalali =
    useMemo(
      () =>
        getJalaliKey(
          now,
        ),
      [now],
    )


  const dateText =
    new Intl.DateTimeFormat(
      isPersian
        ? 'fa-IR'
        : 'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    ).format(now)


  const timeText =
    new Intl.DateTimeFormat(
      isPersian
        ? 'fa-IR'
        : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    ).format(now)


  const hour =
    now.getHours()


  const greeting =
    hour < 12
      ? t.dashboard.greeting
      : hour < 18
        ? isPersian
          ? 'عصر بخیر'
          : 'Good afternoon'
        : isPersian
          ? 'شب بخیر'
          : 'Good evening'


  /* ---------------------------------------------------------------------- */
  /* Today                                                                  */
  /* ---------------------------------------------------------------------- */

  const todayTodos =
    useMemo(
      () =>
        todos.filter(
          (todo) =>
            normalizeJalaliDate(
              todo.dueDate,
            ) ===
            todayJalali,
        ),
      [
        todos,
        todayJalali,
      ],
    )


  const todayActivities =
    useMemo(
      () =>
        activities.filter(
          (activity) =>
            normalizeJalaliDate(
              activity.activityDate,
            ) ===
            todayJalali,
        ),
      [
        activities,
        todayJalali,
      ],
    )


  const todayEvents =
    useMemo(
      () =>
        events
          .filter(
            (event) =>
              normalizeJalaliDate(
                event.eventDate,
              ) ===
              todayJalali,
          )
          .sort(
            (a, b) =>
              (
                a.startTime ??
                '99:99'
              ).localeCompare(
                b.startTime ??
                  '99:99',
              ),
          ),
      [
        events,
        todayJalali,
      ],
    )


  const activeGoals =
    useMemo(
      () =>
        goals.filter(
          (goal) =>
            goal.status ===
            'active',
        ),
      [goals],
    )


  const completedTodayTodos =
    todayTodos.filter(
      (todo) =>
        todo.completed,
    ).length


  const completedTodayActivities =
    todayActivities.filter(
      (activity) =>
        activity.completed,
    ).length


  const activityProgress =
    todayActivities.length
      ? Math.round(
          (
            completedTodayActivities /
            todayActivities.length
          ) * 100,
        )
      : 0


  const averageGoalProgress =
    activeGoals.length
      ? Math.round(
          activeGoals.reduce(
            (
              total,
              goal,
            ) =>
              total +
              clampPercent(
                goal.progress,
              ),
            0,
          ) /
            activeGoals.length,
        )
      : 0


  const latestSleep =
    useMemo(
      () =>
        [
          ...sleepRecords,
        ].sort(
          (a, b) =>
            b.sleepDate.localeCompare(
              a.sleepDate,
            ) ||
            b.createdAt -
              a.createdAt,
        )[0] ??
        null,
      [sleepRecords],
    )


  const visibleActivities =
    todayActivities
      .slice()
      .sort(
        (a, b) =>
          (
            a.startTime ??
            '99:99'
          ).localeCompare(
            b.startTime ??
              '99:99',
          ),
      )
      .slice(0, 6)


  const visibleGoals =
    activeGoals
      .slice()
      .sort(
        (a, b) =>
          clampPercent(
            b.progress,
          ) -
          clampPercent(
            a.progress,
          ),
      )
      .slice(0, 4)


  /* ---------------------------------------------------------------------- */
  /* Stats                                                                  */
  /* ---------------------------------------------------------------------- */

  const stats = [
    {
      title:
        t.dashboard.todo,
      value:
        loading
          ? '—'
          : String(
              todayTodos.length,
            ),
      subtitle:
        isPersian
          ? `${todayTodos.length - completedTodayTodos} باقی مانده`
          : `${todayTodos.length - completedTodayTodos} remaining`,
      icon:
        CheckCircle2,
      color:
        'blue',
      progress:
        todayTodos.length
          ? (
              completedTodayTodos /
              todayTodos.length
            ) * 100
          : 0,
    },

    {
      title:
        t.dashboard.activities,
      value:
        loading
          ? '—'
          : `${activityProgress}%`,
      subtitle:
        isPersian
          ? 'پیشرفت امروز'
          : 'Today progress',
      icon:
        Activity,
      color:
        'emerald',
      progress:
        activityProgress,
    },

    {
      title:
        t.dashboard.goals,
      value:
        loading
          ? '—'
          : String(
              activeGoals.length,
            ),
      subtitle:
        isPersian
          ? `${averageGoalProgress}% میانگین پیشرفت`
          : `${averageGoalProgress}% average progress`,
      icon:
        Target,
      color:
        'violet',
      progress:
        averageGoalProgress,
    },

    {
      title:
        t.dashboard.sleep,
      value:
        loading
          ? '—'
          : latestSleep
            ? formatDuration(
                latestSleep.duration,
                isPersian,
              )
            : '—',
      subtitle:
        latestSleep
          ? isPersian
            ? `کیفیت ${latestSleep.quality}/10`
            : `Quality ${latestSleep.quality}/10`
          : isPersian
            ? 'رکوردی وجود ندارد'
            : 'No record',
      icon:
        Moon,
      color:
        'indigo',
      progress:
        latestSleep
          ? Math.min(
              100,
              (
                latestSleep.duration /
                480
              ) * 100,
            )
          : 0,
    },

    {
      title:
        isPersian
          ? 'رویداد امروز'
          : "Today's events",
      value:
        loading
          ? '—'
          : String(
              todayEvents.length,
            ),
      subtitle:
        isPersian
          ? 'رویداد تقویم'
          : 'Calendar events',
      icon:
        CalendarDays,
      color:
        'amber',
      progress:
        todayEvents.length
          ? 100
          : 0,
    },
  ]


  const colorMap: Record<
    string,
    {
      icon: string
      bar: string
    }
  > = {
    blue: {
      icon:
        'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      bar:
        'bg-blue-500',
    },
    emerald: {
      icon:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      bar:
        'bg-emerald-500',
    },
    violet: {
      icon:
        'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
      bar:
        'bg-violet-500',
    },
    indigo: {
      icon:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
      bar:
        'bg-indigo-500',
    },
    amber: {
      icon:
        'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      bar:
        'bg-amber-500',
    },
  }


  return (
    <div className="space-y-6 pb-10">

      {/* Hero */}

      <section className="animate-[railyFadeUp_.5s_ease_both] relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-[#0b1929]">

        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/[0.07] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/[0.05] blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-5">

            <div className="min-w-0">

              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Clock3 size={14} />
                {dateText}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                {greeting}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t.dashboard.welcome}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {isPersian
                  ? 'حالت خوبه خوشتیپ؟'
                  : 'How s it going, beautiful?'}
              </div>

            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-blue-50 sm:flex dark:bg-blue-500/10">

              <img
                src={dogHelloGif}
                alt="Raily"
                className="h-20 w-20 object-contain transition-transform duration-500 hover:scale-110 hover:-rotate-3"
              />

            </div>

          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
              <Clock3 size={21} />
            </div>

            <div>

              <div className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                {timeText}
              </div>

              <div className="mt-1 text-[11px] text-slate-400">
                {clockDateMode ===
                'server'
                  ? isPersian
                    ? 'زمان سرور'
                    : 'Server time'
                  : clockDateMode ===
                      'manual'
                    ? isPersian
                      ? 'زمان دستی'
                      : 'Manual time'
                    : isPersian
                      ? 'زمان سیستم'
                      : 'System time'}
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Error */}

      {dataError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">

          <span>
            {isPersian
              ? 'بعضی اطلاعات قابل دریافت نبودند ولی اطلاعات موجود نمایش داده می‌شوند.'
              : 'Some records could not be loaded. Available data is still shown.'}
          </span>

          <button
            type="button"
            onClick={() =>
              loadDashboard(
                true,
              )
            }
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-semibold transition hover:bg-amber-100 dark:hover:bg-amber-500/10"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />
            {isPersian
              ? 'تلاش دوباره'
              : 'Retry'}
          </button>

        </div>
      )}


      {/* Stats */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {stats.map(
          (
            stat,
            index,
          ) => {

            const Icon =
              stat.icon

            const colors =
              colorMap[
                stat.color
              ]

            return (
              <div
                key={
                  stat.title
                }
                style={{
                  animationDelay:
                    `${index * 60}ms`,
                }}
                className="animate-[railyFadeUp_.45s_ease_both] group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-slate-400">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                      {stat.value}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {stat.subtitle}
                    </p>

                  </div>

                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 group-hover:rotate-3 ${colors.icon}`}>
                    <Icon size={20} />
                  </div>

                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${colors.bar}`}
                    style={{
                      width:
                        `${loading ? 0 : clampPercent(stat.progress)}%`,
                    }}
                  />
                </div>

              </div>
            )
          },
        )}

      </section>


      {/* Main content */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Activities */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                {isPersian
                  ? 'فعالیت‌های امروز'
                  : "Today's activities"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {isPersian
                  ? 'برنامه و فعالیت‌های ثبت‌شده'
                  : 'Your recorded activities'}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Activity size={18} />
            </div>

          </div>

          <div className="space-y-2">

            {visibleActivities.length > 0 ? (

              visibleActivities.map(
                (
                  activity,
                  index,
                ) => (

                  <div
                    key={
                      activity.id
                    }
                    style={{
                      animationDelay:
                        `${index * 45}ms`,
                    }}
                    className="animate-[railyFadeUp_.35s_ease_both] group flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        activity.completed
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}
                    >
                      <CheckCircle2
                        size={18}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`truncate text-sm font-medium ${
                          activity.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {activity.title}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>
                          {formatTime(
                            activity.startTime,
                            isPersian,
                          )}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-slate-300" />

                        <span>
                          {formatDuration(
                            activity.duration,
                            isPersian,
                          )}
                        </span>
                      </div>

                    </div>

                    <ChevronRight
                      size={16}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                    />

                  </div>

                )

              )

            ) : (

              <EmptyState
                icon={
                  <Activity size={28} />
                }
                text={
                  loading
                    ? isPersian
                      ? 'در حال دریافت اطلاعات...'
                      : 'Loading...'
                    : isPersian
                      ? 'برای امروز فعالیتی ثبت نشده'
                      : 'No activities today'
                }
              />

            )}

          </div>

        </div>


        {/* Progress */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                {t.dashboard.progress}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {isPersian
                  ? 'نمای کلی امروز'
                  : 'Today overview'}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>

          </div>

          <div className="space-y-6">

            <ProgressRow
              label={
                isPersian
                  ? 'کارها'
                  : 'Tasks'
              }
              value={
                todayTodos.length
                  ? Math.round(
                      (
                        completedTodayTodos /
                        todayTodos.length
                      ) * 100,
                    )
                  : 0
              }
              text={
                `${completedTodayTodos}/${todayTodos.length}`
              }
              color="bg-blue-500"
            />

            <ProgressRow
              label={
                isPersian
                  ? 'فعالیت‌ها'
                  : 'Activities'
              }
              value={
                activityProgress
              }
              text={
                `${activityProgress}%`
              }
              color="bg-emerald-500"
            />

            <ProgressRow
              label={
                isPersian
                  ? 'اهداف'
                  : 'Goals'
              }
              value={
                averageGoalProgress
              }
              text={
                `${averageGoalProgress}%`
              }
              color="bg-violet-500"
            />

          </div>

        </div>

      </section>


      {/* Goals + Events */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                {isPersian
                  ? 'اهداف فعال'
                  : 'Active goals'}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {isPersian
                  ? 'اهدافی که در حال پیگیری هستند'
                  : 'Goals currently in progress'}
              </p>
            </div>

            <Target
              size={20}
              className="text-violet-500"
            />

          </div>

          <div className="space-y-5">

            {visibleGoals.length > 0 ? (

              visibleGoals.map(
                (
                  goal,
                ) => {

                  const progress =
                    clampPercent(
                      goal.progress,
                    )

                  return (
                    <div
                      key={
                        goal.id
                      }
                      className="group"
                    >

                      <div className="mb-2 flex items-center justify-between gap-3">

                        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {goal.title}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          {progress}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-1000 group-hover:bg-blue-500"
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                },
              )

            ) : (

              <EmptyState
                icon={
                  <Target size={28} />
                }
                text={
                  loading
                    ? isPersian
                      ? 'در حال دریافت...'
                      : 'Loading...'
                    : isPersian
                      ? 'هدف فعالی ثبت نشده'
                      : 'No active goals'
                }
              />

            )}

          </div>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                {isPersian
                  ? 'رویدادهای امروز'
                  : "Today's events"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {isPersian
                  ? 'برنامه‌های ثبت‌شده در تقویم'
                  : 'Scheduled calendar events'}
              </p>
            </div>

            <CalendarDays
              size={20}
              className="text-amber-500"
            />

          </div>

          <div className="space-y-2">

            {todayEvents.length > 0 ? (

              todayEvents
                .slice(0, 6)
                .map(
                  (
                    event,
                  ) => (

                    <div
                      key={
                        event.id
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >

                      <span
                        className="h-10 w-1 rounded-full"
                        style={{
                          backgroundColor:
                            event.color ??
                            '#3b82f6',
                        }}
                      />

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {event.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {event.allDay
                            ? isPersian
                              ? 'تمام روز'
                              : 'All day'
                            : event.startTime ??
                              (
                                isPersian
                                  ? 'بدون ساعت'
                                  : 'No time'
                              )}

                          {event.location
                            ? ` • ${event.location}`
                            : ''}
                        </p>

                      </div>

                    </div>

                  ),
                )

            ) : (

              <EmptyState
                icon={
                  <CalendarDays size={28} />
                }
                text={
                  loading
                    ? isPersian
                      ? 'در حال دریافت...'
                      : 'Loading...'
                    : isPersian
                      ? 'برای امروز رویدادی وجود ندارد'
                      : 'No events today'
                }
              />

            )}

          </div>

        </div>

      </section>


      <style>{`
        @keyframes railyFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* App                                                                        */

export default function App() {
  const [activePage, setActivePage] =
    useState<Page>('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

  const { language, t } = useLanguage()
  const isPersian = language === 'fa'

  const validPages: Page[] = [
    'dashboard',
    'todo',
    'goals',
    'activities',
    'calendar',
    'sleep',
    'mind',
    'reports',
    'events',
    'settings',
  ]

  function handleNavigate(page: string) {
    if (!validPages.includes(page as Page)) return

    setActivePage(page as Page)
    setMobileSidebarOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'todo':
        return <Todo />
      case 'goals':
        return <Goals />
      case 'activities':
        return <Activities />
      case 'calendar':
        return <Calendar />
      case 'sleep':
        return <Sleep />
      case 'mind':
        return <Mind />
      case 'reports':
        return <Reports />
      case 'events':
        return <Events />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  const pageTitles: Record<Page, string> = {
    dashboard: t.navigation.dashboard,
    todo: t.navigation.todo,
    goals: t.navigation.goals,
    activities: t.navigation.activities,
    calendar: t.navigation.calendar,
    sleep: t.navigation.sleep,
    mind: t.navigation.mind,
    reports: t.navigation.reports,
    events: t.navigation.events,
    settings: t.navigation.settings,
  }

  return (
    <div
      dir={isPersian ? 'rtl' : 'ltr'}
      className="relative flex h-[100dvh] min-h-0 overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white"
    >
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label={isPersian ? 'بستن منو' : 'Close menu'}
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 z-50 w-[280px] shrink-0 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          isPersian ? 'right-0' : 'left-0'
        } ${
          mobileSidebarOpen
            ? 'translate-x-0'
            : isPersian
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
      >
        <div className="h-full w-full overflow-hidden">
          <Sidebar
            activePage={activePage}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Main application area */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((open) => !open)}
            aria-label={isPersian ? 'باز کردن منو' : 'Open menu'}
            aria-expanded={mobileSidebarOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <span className="text-lg leading-none">☰</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              Raily
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {pageTitles[activePage]}
            </p>
          </div>

          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        </header>

        <div className="mx-auto min-h-full w-full max-w-[1700px] p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          <div
            key={activePage}
            className="min-h-full animate-[railyPageIn_.4s_cubic-bezier(.22,1,.36,1)_both] motion-reduce:animate-none"
          >
            {renderPage()}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes railyPageIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(.995);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}