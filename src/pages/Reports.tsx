import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Moon,
  RefreshCw,
  Smile,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toGregorian, toJalaali, isValidJalaaliDate } from 'jalaali-js'

type Lang = 'fa' | 'en'
type RangeMode = '7d' | '30d' | '90d' | 'year'

type SleepRecord = {
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

type ReportDay = {
  key: string
  label: string
  todos: number
  completedTodos: number
  activities: number
  activityMinutes: number
  sleepHours: number
  sleepQuality: number
  sleepCount: number
  mood: number
  energy: number
  happiness: number
  mindCount: number
  events: number
}

const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
}

function parseJalaali(value: string | null | undefined) {
  if (!value) return null

  const normalized = String(value).trim().replace(/-/g, '/')
  const parts = normalized.split('/').map(Number)

  if (parts.length !== 3 || parts.some(Number.isNaN)) return null

  const [jy, jm, jd] = parts

  if (!isValidJalaaliDate(jy, jm, jd)) return null

  return { jy, jm, jd }
}

/**
 * تاریخ شمسی را به کلید استاندارد گزارش تبدیل می‌کند.
 */
function toKey(value: string | null | undefined) {
  const parsed = parseJalaali(value)
  if (!parsed) return null

  return `${parsed.jy}/${String(parsed.jm).padStart(2, '0')}/${String(parsed.jd).padStart(2, '0')}`
}

/**
 * تاریخ میلادی را به کلید شمسی تبدیل می‌کند.
 *
 * Mind.tsx تاریخ checkInDate را به صورت میلادی ذخیره می‌کند:
 * YYYY-MM-DD
 *
 * ولی reportDays با تاریخ شمسی ساخته می‌شود.
 */
function gregorianToJalaaliKey(value: string | null | undefined) {
  if (!value) return null

  const normalized = String(value).trim().replace(/\//g, '-')
  const parts = normalized.split('-').map(Number)

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null
  }

  const [gy, gm, gd] = parts

  if (
    gy < 1900 ||
    gy > 2500 ||
    gm < 1 ||
    gm > 12 ||
    gd < 1 ||
    gd > 31
  ) {
    return null
  }

  const date = new Date(gy, gm - 1, gd)

  if (
    date.getFullYear() !== gy ||
    date.getMonth() !== gm - 1 ||
    date.getDate() !== gd
  ) {
    return null
  }

  const j = toJalaali(gy, gm, gd)

  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`
}

/**
 * تاریخ Mind را مدیریت می‌کند.
 *
 * اول فرض می‌کنیم تاریخ میلادی است چون Mind.tsx
 * تاریخ را به صورت YYYY-MM-DD ذخیره می‌کند.
 *
 * اگر میلادی نبود به عنوان تاریخ شمسی هم امتحان می‌شود.
 */
function mindDateKey(value: string | null | undefined) {
  if (!value) return null

  const gregorianKey = gregorianToJalaaliKey(value)

  if (gregorianKey) {
    return gregorianKey
  }

  return toKey(value)
}

function toDate(jy: number, jm: number, jd: number) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return startOfDay(result)
}

function todayDate() {
  return startOfDay(new Date())
}

function rangeStart(mode: RangeMode) {
  const today = todayDate()
  const j = toJalaali(today)

  if (mode === 'year') {
    return toDate(j.jy, 1, 1)
  }

  const days = mode === '7d' ? 7 : mode === '30d' ? 30 : 90
  return addDays(today, -(days - 1))
}

function buildDays(mode: RangeMode): ReportDay[] {
  const start = rangeStart(mode)
  const today = todayDate()

  const max =
    mode === '7d'
      ? 7
      : mode === '30d'
        ? 30
        : mode === '90d'
          ? 90
          : Math.floor((today.getTime() - start.getTime()) / 86400000) + 1

  const result: ReportDay[] = []

  for (let i = 0; i < max; i += 1) {
    const date = addDays(start, i)

    if (date > today) break

    const j = toJalaali(date)

    result.push({
      key: `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`,
      label: `${j.jm}/${j.jd}`,
      todos: 0,
      completedTodos: 0,
      activities: 0,
      activityMinutes: 0,
      sleepHours: 0,
      sleepQuality: 0,
      sleepCount: 0,
      mood: 0,
      energy: 0,
      happiness: 0,
      mindCount: 0,
      events: 0,
    })
  }

  return result
}

function avg(values: number[]) {
  const valid = values.filter(Number.isFinite)

  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : 0
}

function num(value: unknown) {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

/**
 * اعداد همیشه انگلیسی نمایش داده می‌شوند.
 */
function faNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(num(value))
}

function formatMinutes(minutes: number, lang: Lang) {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const mins = total % 60

  if (lang === 'fa') {
    if (hours === 0) return `${faNumber(mins)} دقیقه`
    if (mins === 0) return `${faNumber(hours)} ساعت`
    return `${faNumber(hours)} ساعت و ${faNumber(mins)} دقیقه`
  }

  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} h`

  return `${hours} h ${mins} min`
}

function Card({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
            <TrendingUp size={17} className="text-blue-500" />
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="h-[290px] w-full">{children}</div>
    </section>
  )
}

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
    color?: string
  }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      dir="rtl"
      className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    >
      <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">
        {label}
      </p>

      {payload.map((item, index) => (
        <p
          key={`${item.name}-${index}`}
          className="flex items-center gap-2 text-slate-500"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />

          <span>{item.name}:</span>

          <strong className="text-slate-800 dark:text-white">
            {item.value}
          </strong>
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [lang, setLang] = useState<Lang>('fa')
  const [range, setRange] = useState<RangeMode>('30d')
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')

  const [todos, setTodos] = useState<RailyTodo[]>([])
  const [goals, setGoals] = useState<RailyGoal[]>([])
  const [activities, setActivities] = useState<RailyActivity[]>([])
  const [sleep, setSleep] = useState<SleepRecord[]>([])
  const [mind, setMind] = useState<RailyMindRecord[]>([])
  const [events, setEvents] = useState<RailyEvent[]>([])

  const isPersian = lang === 'fa'

  async function loadLanguage() {
    try {
      const settings = await window.raily.settings.get()

      if (settings?.language) {
        setLang(settings.language)
      }
    } catch {
      // Persian is the safe default.
    }
  }

  async function loadReport() {
    setLoading(true)
    setError('')

    try {
      const sleepApi = (
        window.raily as typeof window.raily & {
          sleep: {
            get: () => Promise<SleepRecord[]>
          }
        }
      ).sleep

      const [
        todoRows,
        goalRows,
        activityRows,
        sleepRows,
        mindRows,
        eventRows,
      ] = await Promise.all([
        window.raily.todos.get(),
        window.raily.goals.get(),
        window.raily.activities.get(),
        sleepApi.get(),
        window.raily.mind.get(),
        window.raily.events.get(),
      ])

      setTodos(Array.isArray(todoRows) ? todoRows : [])
      setGoals(Array.isArray(goalRows) ? goalRows : [])
      setActivities(Array.isArray(activityRows) ? activityRows : [])
      setSleep(Array.isArray(sleepRows) ? sleepRows : [])
      setMind(Array.isArray(mindRows) ? mindRows : [])
      setEvents(Array.isArray(eventRows) ? eventRows : [])
    } catch (err) {
      console.error('Reports load failed:', err)

      setError(
        isPersian
          ? 'دریافت اطلاعات گزارش انجام نشد.'
          : 'Failed to load report data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLanguage()
    void loadReport()
  }, [])

  const days = useMemo(() => buildDays(range), [range])

  const dayKeys = useMemo(
    () => new Set(days.map((day) => day.key)),
    [days],
  )

  const filteredTodos = useMemo(
    () =>
      todos.filter((item) => {
        const key = toKey(item.dueDate)
        return Boolean(key && dayKeys.has(key))
      }),
    [todos, dayKeys],
  )

  const filteredActivities = useMemo(
    () =>
      activities.filter((item) => {
        const key = toKey(item.activityDate)
        return Boolean(key && dayKeys.has(key))
      }),
    [activities, dayKeys],
  )

  const filteredSleep = useMemo(
    () =>
      sleep.filter((item) => {
        const key = toKey(item.sleepDate)
        return Boolean(key && dayKeys.has(key))
      }),
    [sleep, dayKeys],
  )

  /**
   * فقط Mind از mindDateKey استفاده می‌کند.
   *
   * چون Mind تاریخ را میلادی ذخیره می‌کند ولی reportDays شمسی است.
   */
  const filteredMind = useMemo(
    () =>
      mind.filter((item) => {
        const key = mindDateKey(item.checkInDate)

        return Boolean(key && dayKeys.has(key))
      }),
    [mind, dayKeys],
  )

  const filteredEvents = useMemo(
    () =>
      events.filter((item) => {
        const key = toKey(item.eventDate)
        return Boolean(key && dayKeys.has(key))
      }),
    [events, dayKeys],
  )

  const reportDays = useMemo(() => {
    const map = new Map<string, ReportDay>()

    days.forEach((day) => {
      map.set(day.key, { ...day })
    })

    filteredTodos.forEach((item) => {
      const key = toKey(item.dueDate)

      if (!key) return

      const day = map.get(key)

      if (!day) return

      day.todos += 1

      if (item.completed) {
        day.completedTodos += 1
      }
    })

    filteredActivities.forEach((item) => {
      const key = toKey(item.activityDate)

      if (!key) return

      const day = map.get(key)

      if (!day) return

      day.activities += 1
      day.activityMinutes += Math.max(0, num(item.duration))
    })

    filteredSleep.forEach((item) => {
      const key = toKey(item.sleepDate)

      if (!key) return

      const day = map.get(key)

      if (!day) return

      day.sleepHours += Math.max(0, num(item.duration)) / 60
      day.sleepQuality += Math.max(0, num(item.quality))
      day.sleepCount += 1
    })

    /**
     * Mind aggregation
     *
     * مهم‌ترین تغییر این نسخه:
     *
     * قبلاً:
     * toKey(item.checkInDate)
     *
     * الان:
     * mindDateKey(item.checkInDate)
     *
     * تا تاریخ میلادی Mind به تاریخ شمسی گزارش تبدیل شود.
     */
    filteredMind.forEach((item) => {
      const key = mindDateKey(item.checkInDate)

      if (!key) return

      const day = map.get(key)

      if (!day) return

      day.mood += num(item.mood)
      day.energy += num(item.energy)
      day.happiness += num(item.happiness)
      day.mindCount += 1
    })

    filteredEvents.forEach((item) => {
      const key = toKey(item.eventDate)

      if (!key) return

      const day = map.get(key)

      if (!day) return

      day.events += 1
    })

    return days.map((day) => {
      const item = map.get(day.key) ?? day

      return {
        ...item,

        sleepQuality:
          item.sleepCount > 0
            ? item.sleepQuality / item.sleepCount
            : 0,

        mood:
          item.mindCount > 0
            ? item.mood / item.mindCount
            : 0,

        energy:
          item.mindCount > 0
            ? item.energy / item.mindCount
            : 0,

        happiness:
          item.mindCount > 0
            ? item.happiness / item.mindCount
            : 0,
      }
    })
  }, [
    days,
    filteredTodos,
    filteredActivities,
    filteredSleep,
    filteredMind,
    filteredEvents,
  ])

  const stats = useMemo(() => {
    const completedTodos = filteredTodos.filter(
      (item) => Boolean(item.completed),
    ).length

    const activityMinutes = filteredActivities.reduce(
      (sum, item) => sum + Math.max(0, num(item.duration)),
      0,
    )

    return {
      totalTodos: filteredTodos.length,

      completedTodos,

      completion:
        filteredTodos.length > 0
          ? (completedTodos / filteredTodos.length) * 100
          : 0,

      goalProgress: avg(goals.map((item) => num(item.progress))),

      goalCount: goals.length,

      activityMinutes,

      activityCount: filteredActivities.length,

      averageSleep: avg(
        filteredSleep.map(
          (item) => Math.max(0, num(item.duration)) / 60,
        ),
      ),

      averageSleepQuality: avg(
        filteredSleep.map((item) =>
          Math.max(0, num(item.quality)),
        ),
      ),

      averageMood: avg(
        filteredMind.map((item) => num(item.mood)),
      ),

      averageEnergy: avg(
        filteredMind.map((item) => num(item.energy)),
      ),

      averageHappiness: avg(
        filteredMind.map((item) => num(item.happiness)),
      ),

      eventCount: filteredEvents.length,
    }
  }, [
    filteredTodos,
    goals,
    filteredActivities,
    filteredSleep,
    filteredMind,
    filteredEvents,
  ])

  const goalDistribution = useMemo(() => {
    const buckets = [
      {
        name: isPersian ? '۰ تا ۲۵٪' : '0–25%',
        value: 0,
      },
      {
        name: isPersian ? '۲۶ تا ۵۰٪' : '26–50%',
        value: 0,
      },
      {
        name: isPersian ? '۵۱ تا ۷۵٪' : '51–75%',
        value: 0,
      },
      {
        name: isPersian ? '۷۶ تا ۱۰۰٪' : '76–100%',
        value: 0,
      },
    ]

    goals.forEach((goal) => {
      const progress = Math.min(
        100,
        Math.max(0, num(goal.progress)),
      )

      if (progress <= 25) {
        buckets[0].value += 1
      } else if (progress <= 50) {
        buckets[1].value += 1
      } else if (progress <= 75) {
        buckets[2].value += 1
      } else {
        buckets[3].value += 1
      }
    })

    return buckets
  }, [goals, isPersian])

  const rangeLabel =
    range === '7d'
      ? isPersian
        ? '۷ روز اخیر'
        : 'Last 7 days'
      : range === '30d'
        ? isPersian
          ? '۳۰ روز اخیر'
          : 'Last 30 days'
        : range === '90d'
          ? isPersian
            ? '۹۰ روز اخیر'
            : 'Last 90 days'
          : isPersian
            ? 'از ابتدای سال'
            : 'This year'

  const latestActivities = useMemo(
    () =>
      [...filteredActivities]
        .sort(
          (a, b) => num(b.createdAt) - num(a.createdAt),
        )
        .slice(0, 8),
    [filteredActivities],
  )

  const sortedGoals = useMemo(
    () =>
      [...goals]
        .sort(
          (a, b) => num(b.progress) - num(a.progress),
        )
        .slice(0, 8),
    [goals],
  )

  async function createPdf() {
    setPdfLoading(true)
    setError('')

    try {
      const reportsApi = (
        window.raily as typeof window.raily & {
          reports: {
            createPdf: (report: {
              language: Lang
              rangeLabel: string
              generatedAt: string
              cards: Array<{
                label: string
                value: string
                subtitle: string
              }>
              sections: Array<{
                title: string
                summary?: string
                rows: Array<{
                  label: string
                  value: string
                }>
              }>
            }) => Promise<{
              canceled: boolean
              filePath?: string
            }>
          }
        }
      ).reports

      const generatedAt = new Intl.DateTimeFormat(
        isPersian ? 'fa-IR' : 'en-US',
        {
          dateStyle: 'full',
          timeStyle: 'short',
        },
      ).format(new Date())

      const activityCategories = new Map<string, number>()

      filteredActivities.forEach((item) => {
        const category =
          item.category?.trim() ||
          (isPersian ? 'بدون دسته' : 'Uncategorized')

        activityCategories.set(
          category,
          (activityCategories.get(category) ?? 0) +
            Math.max(0, num(item.duration)),
        )
      })

      const topCategories = [...activityCategories.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)

      const report = {
        language: lang,
        rangeLabel,
        generatedAt,

        cards: [
          {
            label: isPersian ? 'کارهای تکمیل‌شده' : 'Completed tasks',
            value: `${faNumber(stats.completedTodos)} / ${faNumber(
              stats.totalTodos,
            )}`,
            subtitle: `${faNumber(stats.completion, 1)}٪ ${
              isPersian ? 'نرخ تکمیل' : 'completion'
            }`,
          },
          {
            label: isPersian ? 'پیشرفت هدف‌ها' : 'Goal progress',
            value: `${faNumber(stats.goalProgress, 1)}٪`,
            subtitle: `${faNumber(stats.goalCount)} ${
              isPersian ? 'هدف' : 'goals'
            }`,
          },
          {
            label: isPersian ? 'زمان فعالیت' : 'Activity time',
            value: formatMinutes(
              stats.activityMinutes,
              lang,
            ),
            subtitle: `${faNumber(stats.activityCount)} ${
              isPersian ? 'فعالیت' : 'activities'
            }`,
          },
          {
            label: isPersian ? 'میانگین خواب' : 'Average sleep',
            value: `${faNumber(stats.averageSleep, 1)} ${
              isPersian ? 'ساعت' : 'h'
            }`,
            subtitle: `${faNumber(
              stats.averageSleepQuality,
              1,
            )} / 5 ${
              isPersian ? 'کیفیت' : 'quality'
            }`,
          },
          {
            label: isPersian ? 'میانگین حال' : 'Average mood',
            value: `${faNumber(stats.averageMood, 1)} / 10`,
            subtitle: `${faNumber(filteredMind.length)} ${
              isPersian ? 'چک‌این' : 'check-ins'
            }`,
          },
          {
            label: isPersian ? 'میانگین انرژی' : 'Average energy',
            value: `${faNumber(stats.averageEnergy, 1)} / 10`,
            subtitle: isPersian
              ? 'بر اساس Mind'
              : 'From Mind',
          },
          {
            label: isPersian
              ? 'میانگین خوشحالی'
              : 'Average happiness',
            value: `${faNumber(
              stats.averageHappiness,
              1,
            )} / 10`,
            subtitle: isPersian
              ? 'بر اساس Mind'
              : 'From Mind',
          },
          {
            label: isPersian ? 'رویدادها' : 'Events',
            value: faNumber(stats.eventCount),
            subtitle: isPersian
              ? 'در بازه انتخابی'
              : 'Selected range',
          },
        ],

        sections: [
          {
            title: isPersian
              ? 'خلاصه عملکرد'
              : 'Performance summary',

            rows: [
              {
                label: isPersian
                  ? 'نرخ تکمیل کارها'
                  : 'Task completion rate',

                value: `${faNumber(
                  stats.completion,
                  1,
                )}٪`,
              },
              {
                label:
                  isPersian
                    ? 'میانگین پیشرفت هدف‌ها'
                    : 'Average goal progress',

                value: `${faNumber(
                  stats.goalProgress,
                  1,
                )}٪`,
              },
              {
                label: isPersian
                  ? 'کل زمان فعالیت'
                  : 'Total activity time',

                value: formatMinutes(
                  stats.activityMinutes,
                  lang,
                ),
              },
              {
                label: isPersian
                  ? 'تعداد رویدادها'
                  : 'Event count',

                value: faNumber(
                  stats.eventCount,
                ),
              },
            ],
          },

          {
            title: isPersian
              ? 'روند روزانه'
              : 'Daily trend',

            summary: isPersian
              ? 'داده‌های روزانه همین بازه انتخابی.'
              : 'Daily data for the selected range.',

            rows: reportDays.map((day) => ({
              label: day.label,

              value: [
                `${isPersian ? 'کارها' : 'Tasks'}: ${faNumber(
                  day.completedTodos,
                )} / ${faNumber(day.todos)}`,

                `${isPersian ? 'فعالیت' : 'Activity'}: ${formatMinutes(
                  day.activityMinutes,
                  lang,
                )}`,

                `${isPersian ? 'خواب' : 'Sleep'}: ${faNumber(
                  day.sleepHours,
                  1,
                )} ${isPersian ? 'ساعت' : 'h'}`,

                `${isPersian ? 'حال' : 'Mood'}: ${faNumber(
                  day.mood,
                  1,
                )}/10`,

                `${isPersian ? 'انرژی' : 'Energy'}: ${faNumber(
                  day.energy,
                  1,
                )}/10`,

                `${isPersian ? 'خوشحالی' : 'Happiness'}: ${faNumber(
                  day.happiness,
                  1,
                )}/10`,

                `${isPersian ? 'رویداد' : 'Events'}: ${faNumber(
                  day.events,
                )}`,
              ].join(' • '),
            })),
          },

          {
            title: isPersian
              ? 'هدف‌ها'
              : 'Goals',

            rows: sortedGoals.map((goal) => ({
              label: goal.title,

              value: `${faNumber(
                Math.min(
                  100,
                  Math.max(
                    0,
                    num(goal.progress),
                  ),
                ),
                1,
              )}٪${
                goal.category
                  ? ` • ${goal.category}`
                  : ''
              }`,
            })),
          },

          {
            title: isPersian
              ? 'فعالیت‌های اخیر'
              : 'Recent activities',

            rows: latestActivities.map((item) => ({
              label: item.title,

              value: `${item.activityDate} • ${
                item.category ||
                (isPersian
                  ? 'بدون دسته'
                  : 'Uncategorized')
              } • ${formatMinutes(
                num(item.duration),
                lang,
              )}`,
            })),
          },

          {
            title: isPersian
              ? 'دسته‌بندی فعالیت‌ها'
              : 'Activity categories',

            rows: topCategories.map(
              ([category, minutes]) => ({
                label: category,

                value: formatMinutes(
                  minutes,
                  lang,
                ),
              }),
            ),
          },

          {
            title: isPersian
              ? 'خواب'
              : 'Sleep',

            rows: [...filteredSleep]
              .reverse()
              .slice(0, 10)
              .map((item) => ({
                label: item.sleepDate,

                value: `${faNumber(
                  Math.max(
                    0,
                    num(item.duration),
                  ) / 60,
                  1,
                )} ${
                  isPersian ? 'ساعت' : 'h'
                } • ${faNumber(
                  num(item.quality),
                  1,
                )}/5 • ${item.bedtime} → ${
                  item.wakeTime
                }`,
              })),
          },

          {
            title: isPersian
              ? 'وضعیت ذهنی'
              : 'Mind',

            rows: [...filteredMind]
              .sort(
                (a, b) =>
                  num(b.createdAt) -
                  num(a.createdAt),
              )
              .slice(0, 10)
              .map((item) => ({
                label: item.checkInDate,

                value: `${
                  isPersian
                    ? 'حال'
                    : 'Mood'
                } ${faNumber(
                  num(item.mood),
                  1,
                )}/10 • ${
                  isPersian
                    ? 'انرژی'
                    : 'Energy'
                } ${faNumber(
                  num(item.energy),
                  1,
                )}/10 • ${
                  isPersian
                    ? 'خوشحالی'
                    : 'Happiness'
                } ${faNumber(
                  num(item.happiness),
                  1,
                )}/10`,
              })),
          },

          {
            title: isPersian
              ? 'رویدادها'
              : 'Events',

            rows: [...filteredEvents]
              .sort(
                (a, b) =>
                  num(b.createdAt) -
                  num(a.createdAt),
              )
              .slice(0, 10)
              .map((item) => ({
                label: `${item.eventDate} • ${item.title}`,

                value:
                  [
                    item.startTime,
                    item.endTime,
                  ]
                    .filter(Boolean)
                    .join(' → ') ||
                  (item.allDay
                    ? isPersian
                      ? 'تمام روز'
                      : 'All day'
                    : ''),
              })),
          },
        ].filter(
          (section) =>
            section.rows.length > 0,
        ),
      }

      const result =
        await reportsApi.createPdf(
          report,
        )

      if (
        !result.canceled &&
        !result.filePath
      ) {
        throw new Error(
          'pdf-failed',
        )
      }
    } catch (err) {
      console.error(
        'Report PDF creation failed:',
        err,
      )

      setError(
        isPersian
          ? 'ساخت گزارش PDF انجام نشد.'
          : 'Could not create the PDF report.',
      )
    } finally {
      setPdfLoading(false)
    }
  }

  const commonTooltip = {
    content: <TooltipContent />,

    cursor: {
      fill: 'rgba(59,130,246,.05)',
    },
  }

  return (
    <div
      dir={isPersian ? 'rtl' : 'ltr'}
      className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white"
    >
      <style>{`
        @keyframes report-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .report-section {
          animation: report-in .45s cubic-bezier(.22,1,.36,1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .report-section {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1550px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="report-section mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <BarChart3 size={16} />

                {isPersian
                  ? 'گزارش جامع Raily'
                  : 'Raily Reports'}
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {isPersian
                  ? 'گزارش وضعیت زندگی'
                  : 'Life overview report'}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {isPersian
                  ? 'اطلاعات واقعی ثبت‌شده در Todo، Goals، Activities، Sleep، Mind و Events را در یک گزارش قابل تحلیل ببین.'
                  : 'Analyze real data from Todo, Goals, Activities, Sleep, Mind and Events in one report.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void loadReport()
                }
                disabled={loading}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />

                {isPersian
                  ? 'بروزرسانی'
                  : 'Refresh'}
              </button>

              <button
                type="button"
                onClick={() =>
                  void createPdf()
                }
                disabled={
                  loading ||
                  pdfLoading
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
              >
                <FileText size={17} />

                {pdfLoading
                  ? isPersian
                    ? 'در حال ساخت PDF...'
                    : 'Creating PDF...'
                  : isPersian
                    ? 'ساخت گزارش PDF'
                    : 'Create PDF report'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <section className="report-section mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays
                size={17}
                className="text-blue-500"
              />

              <div>
                <p className="font-bold">
                  {isPersian
                    ? 'بازه گزارش'
                    : 'Report range'}
                </p>

                <p className="text-xs text-slate-400">
                  {rangeLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  [
                    '7d',
                    isPersian
                      ? '۷ روز'
                      : '7 days',
                  ],
                  [
                    '30d',
                    isPersian
                      ? '۳۰ روز'
                      : '30 days',
                  ],
                  [
                    '90d',
                    isPersian
                      ? '۹۰ روز'
                      : '90 days',
                  ],
                  [
                    'year',
                    isPersian
                      ? 'امسال'
                      : 'This year',
                  ],
                ] as Array<
                  [RangeMode, string]
                >
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRange(value)
                    }
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      range === value
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<CheckCircle2 size={20} />}
            title={
              isPersian
                ? 'کارهای تکمیل‌شده'
                : 'Completed tasks'
            }
            value={`${faNumber(
              stats.completedTodos,
            )} / ${faNumber(
              stats.totalTodos,
            )}`}
            subtitle={`${faNumber(
              stats.completion,
              1,
            )}٪ ${
              isPersian
                ? 'نرخ تکمیل'
                : 'completion'
            }`}
          />

          <Card
            icon={<Target size={20} />}
            title={
              isPersian
                ? 'پیشرفت هدف‌ها'
                : 'Goal progress'
            }
            value={`${faNumber(
              stats.goalProgress,
              1,
            )}٪`}
            subtitle={`${faNumber(
              stats.goalCount,
            )} ${
              isPersian
                ? 'هدف'
                : 'goals'
            }`}
          />

          <Card
            icon={<Activity size={20} />}
            title={
              isPersian
                ? 'زمان فعالیت'
                : 'Activity time'
            }
            value={formatMinutes(
              stats.activityMinutes,
              lang,
            )}
            subtitle={`${faNumber(
              stats.activityCount,
            )} ${
              isPersian
                ? 'فعالیت'
                : 'activities'
            }`}
          />

          <Card
            icon={<Moon size={20} />}
            title={
              isPersian
                ? 'میانگین خواب'
                : 'Average sleep'
            }
            value={`${faNumber(
              stats.averageSleep,
              1,
            )} ${
              isPersian
                ? 'ساعت'
                : 'h'
            }`}
            subtitle={`${faNumber(
              stats.averageSleepQuality,
              1,
            )} / 5 ${
              isPersian
                ? 'کیفیت'
                : 'quality'
            }`}
          />

          <Card
            icon={<Smile size={20} />}
            title={
              isPersian
                ? 'میانگین حال'
                : 'Average mood'
            }
            value={`${faNumber(
              stats.averageMood,
              1,
            )} / 10`}
            subtitle={`${faNumber(
              filteredMind.length,
            )} ${
              isPersian
                ? 'چک‌این'
                : 'check-ins'
            }`}
          />

          <Card
            icon={<Zap size={20} />}
            title={
              isPersian
                ? 'میانگین انرژی'
                : 'Average energy'
            }
            value={`${faNumber(
              stats.averageEnergy,
              1,
            )} / 10`}
            subtitle={
              isPersian
                ? 'بر اساس Mind'
                : 'From Mind'
            }
          />

          <Card
            icon={<Trophy size={20} />}
            title={
              isPersian
                ? 'میانگین خوشحالی'
                : 'Average happiness'
            }
            value={`${faNumber(
              stats.averageHappiness,
              1,
            )} / 10`}
            subtitle={
              isPersian
                ? 'بر اساس Mind'
                : 'From Mind'
            }
          />

          <Card
            icon={<CalendarDays size={20} />}
            title={
              isPersian
                ? 'رویدادها'
                : 'Events'
            }
            value={faNumber(
              stats.eventCount,
            )}
            subtitle={
              isPersian
                ? 'در بازه انتخابی'
                : 'Selected range'
            }
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title={
              isPersian
                ? 'روند کارها'
                : 'Task trend'
            }
            description={
              isPersian
                ? 'کارهای ثبت‌شده و تکمیل‌شده در طول زمان'
                : 'Tasks and completed tasks over time'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={reportDays}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  {...commonTooltip}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="todos"
                  name={
                    isPersian
                      ? 'کل کارها'
                      : 'All tasks'
                  }
                  stroke={
                    COLORS.blue
                  }
                  strokeWidth={3}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="completedTodos"
                  name={
                    isPersian
                      ? 'تکمیل‌شده'
                      : 'Completed'
                  }
                  stroke={
                    COLORS.emerald
                  }
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={
              isPersian
                ? 'زمان فعالیت'
                : 'Activity time'
            }
            description={
              isPersian
                ? 'دقیقه فعالیت ثبت‌شده در هر روز'
                : 'Minutes recorded each day'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={reportDays}
              >
                <defs>
                  <linearGradient
                    id="activityFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        COLORS.violet
                      }
                      stopOpacity={
                        0.35
                      }
                    />

                    <stop
                      offset="100%"
                      stopColor={
                        COLORS.violet
                      }
                      stopOpacity={
                        0.02
                      }
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  {...commonTooltip}
                />

                <Area
                  type="monotone"
                  dataKey="activityMinutes"
                  name={
                    isPersian
                      ? 'دقیقه'
                      : 'Minutes'
                  }
                  stroke={
                    COLORS.violet
                  }
                  fill="url(#activityFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={
              isPersian
                ? 'خواب'
                : 'Sleep'
            }
            description={
              isPersian
                ? 'مدت خواب و کیفیت خواب'
                : 'Sleep duration and quality'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={reportDays}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="hours"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="quality"
                  orientation="right"
                  domain={[0, 5]}
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  {...commonTooltip}
                />

                <Legend />

                <Line
                  yAxisId="hours"
                  type="monotone"
                  dataKey="sleepHours"
                  name={
                    isPersian
                      ? 'ساعت خواب'
                      : 'Sleep hours'
                  }
                  stroke={
                    COLORS.cyan
                  }
                  strokeWidth={3}
                  dot={false}
                />

                <Line
                  yAxisId="quality"
                  type="monotone"
                  dataKey="sleepQuality"
                  name={
                    isPersian
                      ? 'کیفیت'
                      : 'Quality'
                  }
                  stroke={
                    COLORS.amber
                  }
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* =========================
              MIND CHART
              تنها بخش اصلاح‌شده نمودارها
              ========================= */}

          <ChartCard
            title={
              isPersian
                ? 'وضعیت ذهنی'
                : 'Mind trend'
            }
            description={
              isPersian
                ? 'حال، انرژی و خوشحالی در طول زمان'
                : 'Mood, energy and happiness over time'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={reportDays}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  domain={[0, 5]}
                  allowDecimals={true}
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  {...commonTooltip}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="mood"
                  name={
                    isPersian
                      ? 'حال'
                      : 'Mood'
                  }
                  stroke={
                    COLORS.rose
                  }
                  strokeWidth={3}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="energy"
                  name={
                    isPersian
                      ? 'انرژی'
                      : 'Energy'
                  }
                  stroke={
                    COLORS.amber
                  }
                  strokeWidth={3}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="happiness"
                  name={
                    isPersian
                      ? 'خوشحالی'
                      : 'Happiness'
                  }
                  stroke={
                    COLORS.emerald
                  }
                  strokeWidth={3}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={
              isPersian
                ? 'تعداد فعالیت‌ها'
                : 'Activity count'
            }
            description={
              isPersian
                ? 'تعداد فعالیت‌های ثبت‌شده در هر روز'
                : 'Activities recorded each day'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={reportDays}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  {...commonTooltip}
                />

                <Bar
                  dataKey="activities"
                  name={
                    isPersian
                      ? 'فعالیت'
                      : 'Activities'
                  }
                  fill={
                    COLORS.blue
                  }
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={
              isPersian
                ? 'توزیع پیشرفت هدف‌ها'
                : 'Goal progress distribution'
            }
            description={
              isPersian
                ? 'هدف‌ها بر اساس درصد پیشرفت'
                : 'Goals grouped by progress'
            }
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={
                    goalDistribution
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  label
                >
                  {goalDistribution.map(
                    (_, index) => (
                      <Cell
                        key={`goal-${index}`}
                        fill={
                          [
                            COLORS.rose,
                            COLORS.amber,
                            COLORS.blue,
                            COLORS.emerald,
                          ][index]
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip
                  {...commonTooltip}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <Target
                size={18}
                className="text-violet-500"
              />

              <div>
                <h2 className="font-bold">
                  {isPersian
                    ? 'هدف‌های فعلی'
                    : 'Current goals'}
                </h2>

                <p className="text-xs text-slate-400">
                  {isPersian
                    ? 'پیشرفت واقعی ذخیره‌شده در دیتابیس'
                    : 'Actual progress stored in the database'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sortedGoals.length ? (
                sortedGoals.map(
                  (goal) => {
                    const progress =
                      Math.min(
                        100,
                        Math.max(
                          0,
                          num(
                            goal.progress,
                          ),
                        ),
                      )

                    return (
                      <div
                        key={goal.id}
                        className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold">
                            {goal.title}
                          </span>

                          <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                            {faNumber(
                              progress,
                            )}
                            ٪
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  },
                )
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">
                  {isPersian
                    ? 'هدفی ثبت نشده.'
                    : 'No goals recorded.'}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-2">
              <Clock3
                size={18}
                className="text-blue-500"
              />

              <div>
                <h2 className="font-bold">
                  {isPersian
                    ? 'آخرین فعالیت‌ها'
                    : 'Recent activities'}
                </h2>

                <p className="text-xs text-slate-400">
                  {isPersian
                    ? 'فعالیت‌های موجود در بازه انتخابی'
                    : 'Activities inside the selected range'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {latestActivities.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-950"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.activityDate} ·{' '}
                        {item.category ||
                          (isPersian
                            ? 'بدون دسته'
                            : 'Uncategorized')}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300">
                      {formatMinutes(
                        num(
                          item.duration,
                        ),
                        lang,
                      )}
                    </span>
                  </div>
                ),
              )}

              {!latestActivities.length && (
                <p className="py-10 text-center text-sm text-slate-400">
                  {isPersian
                    ? 'فعالیتی در این بازه ثبت نشده.'
                    : 'No activities in this range.'}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}