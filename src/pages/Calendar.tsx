import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ListTodo,
  MapPin,
  Target,
} from 'lucide-react'
import {
  jalaaliMonthLength,
  toGregorian,
  toJalaali,
} from 'jalaali-js'
import { useLanguage } from '../i18n/LanguageContext'

type CalendarItemType = 'todo' | 'activity' | 'goal' | 'event'

interface CalendarItem {
  id: string
  type: CalendarItemType
  title: string
  completed?: boolean
  time?: string | null
  endTime?: string | null
  category?: string | null
  location?: string | null
  color?: string | null
  allDay?: boolean
  description?: string | null
}

interface CalendarDay {
  year: number
  month: number
  day: number
  date: string
  currentMonth: boolean
}

interface RailyEvent {
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

const jalaliMonthsFa = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const jalaliMonthsEn = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
]

const weekdaysFa = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
]

const weekdaysEn = [
  'Sat',
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
]

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatJalaliDate(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseJalaliDate(value: string | null | undefined) {
  if (!value) return null

  const parts = value.split('-').map(Number)

  if (
    parts.length !== 3 ||
    parts.some((part) => Number.isNaN(part))
  ) {
    return null
  }

  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  }
}

function getTodayFromTimestamp(timestamp: number) {
  const date = new Date(timestamp)

  return toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
}

function getMonthOffset(
  year: number,
  month: number,
  offset: number,
) {
  let newYear = year
  let newMonth = month + offset

  while (newMonth < 1) {
    newMonth += 12
    newYear -= 1
  }

  while (newMonth > 12) {
    newMonth -= 12
    newYear += 1
  }

  return {
    year: newYear,
    month: newMonth,
  }
}

function getCalendarDays(
  year: number,
  month: number,
): CalendarDay[] {
  const firstGregorian = toGregorian(
    year,
    month,
    1,
  )

  const firstDate = new Date(
    firstGregorian.gy,
    firstGregorian.gm - 1,
    firstGregorian.gd,
  )

  const firstWeekday =
    (firstDate.getDay() + 1) % 7

  const daysInMonth =
    jalaaliMonthLength(year, month)

  const previous = getMonthOffset(
    year,
    month,
    -1,
  )

  const previousMonthDays =
    jalaaliMonthLength(
      previous.year,
      previous.month,
    )

  const result: CalendarDay[] = []

  for (
    let index = firstWeekday - 1;
    index >= 0;
    index--
  ) {
    const day = previousMonthDays - index

    result.push({
      year: previous.year,
      month: previous.month,
      day,
      date: formatJalaliDate(
        previous.year,
        previous.month,
        day,
      ),
      currentMonth: false,
    })
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    result.push({
      year,
      month,
      day,
      date: formatJalaliDate(
        year,
        month,
        day,
      ),
      currentMonth: true,
    })
  }

  const next = getMonthOffset(
    year,
    month,
    1,
  )

  let nextDay = 1

  while (result.length < 42) {
    result.push({
      year: next.year,
      month: next.month,
      day: nextDay,
      date: formatJalaliDate(
        next.year,
        next.month,
        nextDay,
      ),
      currentMonth: false,
    })

    nextDay++
  }

  return result
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null

  const parsed = parseJalaliDate(value)

  if (parsed) {
    return formatJalaliDate(
      parsed.year,
      parsed.month,
      parsed.day,
    )
  }

  return value.slice(0, 10)
}

export default function Calendar() {
  const {
    language,
    theme,
  } = useLanguage()

  const isPersian = language === 'fa'
  const isDark = theme === 'dark'

  const [today, setToday] = useState(() => {
    const current = getTodayFromTimestamp(
      Date.now(),
    )

    return {
      year: current.jy,
      month: current.jm,
      day: current.jd,
    }
  })

  const [viewYear, setViewYear] =
    useState(today.year)

  const [viewMonth, setViewMonth] =
    useState(today.month)

  const [selectedDate, setSelectedDate] =
    useState(
      formatJalaliDate(
        today.year,
        today.month,
        today.day,
      ),
    )

  const [todos, setTodos] =
    useState<any[]>([])

  const [activities, setActivities] =
    useState<any[]>([])

  const [goals, setGoals] =
    useState<any[]>([])

  const [events, setEvents] =
    useState<RailyEvent[]>([])

  const [loading, setLoading] =
    useState(true)

  const refreshData = async () => {
    try {
      setLoading(true)

      const [
        todoData,
        activityData,
        goalData,
        eventData,
      ] = await Promise.all([
        window.raily.todos.get(),
        window.raily.activities.get(),
        window.raily.goals.get(),
        window.raily.events.get(),
      ])

      setTodos(todoData || [])
      setActivities(activityData || [])
      setGoals(goalData || [])
      setEvents(eventData || [])
    } catch (error) {
      console.error(
        'Failed to load calendar data:',
        error,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    let mounted = true

    const updateClock = async () => {
      try {
        const clock =
          await window.raily.clock.get()

        if (!mounted) return

        const current =
          getTodayFromTimestamp(
            clock.timestamp,
          )

        setToday({
          year: current.jy,
          month: current.jm,
          day: current.jd,
        })
      } catch {
        // Local date remains the fallback.
      }
    }

    updateClock()

    const interval =
      window.setInterval(
        updateClock,
        5000,
      )

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const todayDate =
    formatJalaliDate(
      today.year,
      today.month,
      today.day,
    )

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        viewYear,
        viewMonth,
      ),
    [viewYear, viewMonth],
  )

  const monthItems = useMemo(() => {
    const items =
      new Map<
        string,
        CalendarItem[]
      >()

    const addItem = (
      date: string | null | undefined,
      item: CalendarItem,
    ) => {
      const normalized =
        normalizeDate(date)

      if (!normalized) return

      const current =
        items.get(normalized) || []

      current.push(item)

      items.set(
        normalized,
        current,
      )
    }

    todos.forEach((todo) => {
      addItem(
        todo.dueDate ||
          todo.date ||
          todo.targetDate,
        {
          id: `todo-${todo.id}`,
          type: 'todo',
          title:
            todo.title ||
            (isPersian
              ? 'کار بدون عنوان'
              : 'Untitled task'),
          completed:
            Boolean(
              todo.completed,
            ),
        },
      )
    })

    activities.forEach(
      (activity) => {
        addItem(
          activity.activityDate,
          {
            id: `activity-${activity.id}`,
            type: 'activity',
            title:
              activity.title ||
              (isPersian
                ? 'فعالیت بدون عنوان'
                : 'Untitled activity'),
            completed:
              Boolean(
                activity.completed,
              ),
            time:
              activity.startTime,
            endTime:
              activity.endTime,
            category:
              activity.category,
          },
        )
      },
    )

    goals.forEach((goal) => {
      addItem(
        goal.startDate,
        {
          id: `goal-start-${goal.id}`,
          type: 'goal',
          title:
            goal.title ||
            (isPersian
              ? 'هدف بدون عنوان'
              : 'Untitled goal'),
        },
      )

      if (
        goal.targetDate &&
        goal.targetDate !==
          goal.startDate
      ) {
        addItem(
          goal.targetDate,
          {
            id: `goal-target-${goal.id}`,
            type: 'goal',
            title:
              goal.title ||
              (isPersian
                ? 'هدف بدون عنوان'
                : 'Untitled goal'),
          },
        )
      }
    })

    events.forEach((event) => {
      addItem(
        event.eventDate,
        {
          id: `event-${event.id}`,
          type: 'event',
          title:
            event.title ||
            (isPersian
              ? 'رویداد بدون عنوان'
              : 'Untitled event'),
          time:
            event.allDay
              ? null
              : event.startTime,
          endTime:
            event.allDay
              ? null
              : event.endTime,
          category:
            event.category,
          location:
            event.location,
          color:
            event.color,
          allDay:
            Boolean(event.allDay),
          description:
            event.description,
        },
      )
    })

    items.forEach((dayItems) => {
      dayItems.sort((a, b) => {
        if (
          a.type === 'event' &&
          b.type !== 'event'
        ) {
          return -1
        }

        if (
          a.type !== 'event' &&
          b.type === 'event'
        ) {
          return 1
        }

        return (
          (a.time || '99:99').localeCompare(
            b.time || '99:99',
          )
        )
      })
    })

    return items
  }, [
    todos,
    activities,
    goals,
    events,
    isPersian,
  ])

  const selectedItems =
    monthItems.get(
      selectedDate,
    ) || []

  const currentMonthPrefix =
    `${viewYear}-${pad(viewMonth)}-`

  const currentMonthItems =
    useMemo(() => {
      const result: CalendarItem[] = []

      monthItems.forEach(
        (items, date) => {
          if (
            date.startsWith(
              currentMonthPrefix,
            )
          ) {
            result.push(...items)
          }
        },
      )

      return result
    }, [
      monthItems,
      currentMonthPrefix,
    ])

  const monthEventCount =
    currentMonthItems.filter(
      (item) =>
        item.type === 'event',
    ).length

  const monthTodoCount =
    currentMonthItems.filter(
      (item) =>
        item.type === 'todo',
    ).length

  const monthActivityCount =
    currentMonthItems.filter(
      (item) =>
        item.type === 'activity',
    ).length

  const monthGoalCount =
    currentMonthItems.filter(
      (item) =>
        item.type === 'goal',
    ).length

  const goToToday = () => {
    setViewYear(today.year)
    setViewMonth(today.month)
    setSelectedDate(todayDate)
  }

  const goToPreviousMonth = () => {
    const previous =
      getMonthOffset(
        viewYear,
        viewMonth,
        -1,
      )

    setViewYear(previous.year)
    setViewMonth(previous.month)
    setSelectedDate(
      formatJalaliDate(
        previous.year,
        previous.month,
        1,
      ),
    )
  }

  const goToNextMonth = () => {
    const next =
      getMonthOffset(
        viewYear,
        viewMonth,
        1,
      )

    setViewYear(next.year)
    setViewMonth(next.month)
    setSelectedDate(
      formatJalaliDate(
        next.year,
        next.month,
        1,
      ),
    )
  }

  const selectedParsed =
    parseJalaliDate(
      selectedDate,
    )

  const selectedMonthName =
    selectedParsed
      ? isPersian
        ? jalaliMonthsFa[
            selectedParsed.month - 1
          ]
        : jalaliMonthsEn[
            selectedParsed.month - 1
          ]
      : ''

  const formatSelectedDate = () => {
    if (!selectedParsed) {
      return selectedDate
    }

    if (isPersian) {
      return `${selectedParsed.day} ${selectedMonthName} ${selectedParsed.year}`
    }

    return `${selectedMonthName} ${selectedParsed.day}, ${selectedParsed.year}`
  }

  const getDayItems = (
    date: string,
  ) =>
    monthItems.get(date) || []

  const getItemIcon = (
    type: CalendarItemType,
  ) => {
    if (type === 'todo') {
      return <ListTodo size={17} />
    }

    if (type === 'activity') {
      return <Activity size={17} />
    }

    if (type === 'goal') {
      return <Target size={17} />
    }

    return <CalendarCheck2 size={17} />
  }

  const getItemLabel = (
    type: CalendarItemType,
  ) => {
    if (type === 'todo') {
      return isPersian
        ? 'کار'
        : 'Task'
    }

    if (type === 'activity') {
      return isPersian
        ? 'فعالیت'
        : 'Activity'
    }

    if (type === 'goal') {
      return isPersian
        ? 'هدف'
        : 'Goal'
    }

    return isPersian
      ? 'رویداد'
      : 'Event'
  }

  const getItemTone = (
    item: CalendarItem,
  ) => {
    if (item.type === 'event') {
      return item.color || '#6366f1'
    }

    if (item.type === 'activity') {
      return '#3b82f6'
    }

    if (item.type === 'todo') {
      return '#f59e0b'
    }

    return '#8b5cf6'
  }

  return (
    <div
      dir={
        isPersian
          ? 'rtl'
          : 'ltr'
      }
      className="space-y-6"
    >
      <section
        className={`
          relative overflow-hidden rounded-3xl
          border p-6
          transition-all duration-500
          ${
            isDark
              ? 'border-slate-800 bg-slate-900/80'
              : 'border-slate-200 bg-white'
          }
        `}
      >
        <div
          className="
            pointer-events-none absolute
            -right-20 -top-20 h-56 w-56
            rounded-full bg-blue-500/10 blur-3xl
          "
        />

        <div
          className="
            pointer-events-none absolute
            -bottom-24 -left-20 h-64 w-64
            rounded-full bg-indigo-500/10 blur-3xl
          "
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-12 w-12 items-center
                justify-center rounded-2xl
                bg-blue-600 text-white
                shadow-lg shadow-blue-500/20
              "
            >
              <CalendarDays size={24} />
            </div>

            <div>
              <h1
                className={`
                  text-2xl font-bold
                  ${
                    isDark
                      ? 'text-white'
                      : 'text-slate-900'
                  }
                `}
              >
                {isPersian
                  ? 'تقویم'
                  : 'Calendar'}
              </h1>

              <p
                className={`
                  mt-1 text-sm
                  ${
                    isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }
                `}
              >
                {isPersian
                  ? 'کارها، فعالیت‌ها، هدف‌ها و رویدادها را یکجا ببین'
                  : 'See tasks, activities, goals and events in one place'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="
              inline-flex min-h-11 items-center
              justify-center gap-2 rounded-xl
              bg-blue-600 px-5 text-sm font-semibold
              text-white shadow-lg shadow-blue-600/20
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-blue-700
              active:translate-y-0
            "
          >
            <CalendarCheck2 size={18} />
            {isPersian ? 'امروز' : 'Today'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: isPersian ? 'رویدادها' : 'Events',
            value: monthEventCount,
            icon: <CalendarCheck2 size={19} />,
            tone: 'text-indigo-500 bg-indigo-500/10',
          },
          {
            label: isPersian ? 'فعالیت‌ها' : 'Activities',
            value: monthActivityCount,
            icon: <Activity size={19} />,
            tone: 'text-blue-500 bg-blue-500/10',
          },
          {
            label: isPersian ? 'کارها' : 'Tasks',
            value: monthTodoCount,
            icon: <ListTodo size={19} />,
            tone: 'text-amber-500 bg-amber-500/10',
          },
          {
            label: isPersian ? 'هدف‌ها' : 'Goals',
            value: monthGoalCount,
            icon: <Target size={19} />,
            tone: 'text-violet-500 bg-violet-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`
              rounded-2xl border p-4
              transition-all duration-300
              hover:-translate-y-0.5
              ${
                isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }
            `}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  {stat.label}
                </p>

                <p
                  className={`
                    mt-2 text-2xl font-bold
                    ${
                      isDark
                        ? 'text-white'
                        : 'text-slate-900'
                    }
                  `}
                >
                  {stat.value}
                </p>
              </div>

              <div
                className={`rounded-xl p-3 ${stat.tone}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
        <section
          className={`
            overflow-hidden rounded-3xl border
            ${
              isDark
                ? 'border-slate-800 bg-slate-900'
                : 'border-slate-200 bg-white'
            }
          `}
        >
          <div
            className={`
              flex items-center justify-between
              border-b px-5 py-4
              ${
                isDark
                  ? 'border-slate-800'
                  : 'border-slate-100'
              }
            `}
          >
            <button
              type="button"
              onClick={
                isPersian
                  ? goToNextMonth
                  : goToPreviousMonth
              }
              className={`
                flex h-10 w-10 items-center
                justify-center rounded-xl
                transition-all
                ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
              aria-label={
                isPersian
                  ? 'ماه بعد'
                  : 'Previous month'
              }
            >
              {isPersian ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>

            <div className="text-center">
              <h2
                className={`
                  text-lg font-bold
                  ${
                    isDark
                      ? 'text-white'
                      : 'text-slate-900'
                  }
                `}
              >
                {isPersian
                  ? jalaliMonthsFa[
                      viewMonth - 1
                    ]
                  : jalaliMonthsEn[
                      viewMonth - 1
                    ]}
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                {viewYear}
              </p>
            </div>

            <button
              type="button"
              onClick={
                isPersian
                  ? goToPreviousMonth
                  : goToNextMonth
              }
              className={`
                flex h-10 w-10 items-center
                justify-center rounded-xl
                transition-all
                ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
              aria-label={
                isPersian
                  ? 'ماه قبل'
                  : 'Next month'
              }
            >
              {isPersian ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200/70 dark:border-slate-800">
            {(isPersian
              ? weekdaysFa
              : weekdaysEn
            ).map((weekday) => (
              <div
                key={weekday}
                className="flex h-11 items-center justify-center text-xs font-semibold text-slate-500"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const items =
                getDayItems(day.date)

              const isToday =
                day.date === todayDate

              const isSelected =
                day.date === selectedDate

              const hasEvents =
                items.some(
                  (item) =>
                    item.type === 'event',
                )

              const hasActivities =
                items.some(
                  (item) =>
                    item.type === 'activity',
                )

              const hasTodos =
                items.some(
                  (item) =>
                    item.type === 'todo',
                )

              const hasGoals =
                items.some(
                  (item) =>
                    item.type === 'goal',
                )

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      day.date,
                    )
                  }
                  className={`
                    group relative
                    min-h-[105px]
                    border-b border-r
                    p-2 text-start
                    transition-all duration-200
                    ${
                      isDark
                        ? 'border-slate-800'
                        : 'border-slate-100'
                    }
                    ${
                      !day.currentMonth
                        ? isDark
                          ? 'bg-slate-950/30'
                          : 'bg-slate-50/50'
                        : ''
                    }
                    ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-500/10'
                          : 'bg-blue-50/80'
                        : ''
                    }
                    ${
                      !isSelected
                        ? isDark
                          ? 'hover:bg-slate-800/70'
                          : 'hover:bg-slate-50'
                        : ''
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute inset-y-0 start-0 w-0.5 bg-blue-500" />
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      className={`
                        flex h-7 w-7 items-center
                        justify-center rounded-lg
                        text-sm font-semibold
                        ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : day.currentMonth
                              ? isDark
                                ? 'text-slate-200'
                                : 'text-slate-700'
                              : isDark
                                ? 'text-slate-700'
                                : 'text-slate-300'
                        }
                      `}
                    >
                      {day.day}
                    </span>

                    {items.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {items.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex min-h-5 flex-wrap gap-1.5">
                    {hasEvents && (
                      <span
                        title={
                          isPersian
                            ? 'رویداد'
                            : 'Event'
                        }
                        className="h-2 w-2 rounded-full bg-indigo-500"
                      />
                    )}

                    {hasActivities && (
                      <span
                        title={
                          isPersian
                            ? 'فعالیت'
                            : 'Activity'
                        }
                        className="h-2 w-2 rounded-full bg-blue-500"
                      />
                    )}

                    {hasTodos && (
                      <span
                        title={
                          isPersian
                            ? 'کار'
                            : 'Task'
                        }
                        className="h-2 w-2 rounded-full bg-amber-500"
                      />
                    )}

                    {hasGoals && (
                      <span
                        title={
                          isPersian
                            ? 'هدف'
                            : 'Goal'
                        }
                        className="h-2 w-2 rounded-full bg-violet-500"
                      />
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="mt-1 hidden space-y-1 sm:block">
                      {items
                        .slice(0, 2)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex min-w-0 items-center gap-1.5"
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  getItemTone(
                                    item,
                                  ),
                              }}
                            />

                            <span
                              className={`
                                truncate text-[10px]
                                ${
                                  item.type ===
                                  'event'
                                    ? 'font-semibold text-indigo-500'
                                    : item.type ===
                                        'activity'
                                      ? 'text-blue-500'
                                      : item.type ===
                                          'todo'
                                        ? 'text-amber-500'
                                        : 'text-violet-500'
                                }
                              `}
                            >
                              {item.title}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div
            className={`
              flex flex-wrap gap-4
              border-t px-5 py-4
              ${
                isDark
                  ? 'border-slate-800'
                  : 'border-slate-100'
              }
            `}
          >
            {[
              {
                label: isPersian
                  ? 'رویداد'
                  : 'Event',
                color:
                  'bg-indigo-500',
              },
              {
                label: isPersian
                  ? 'فعالیت'
                  : 'Activity',
                color:
                  'bg-blue-500',
              },
              {
                label: isPersian
                  ? 'کار'
                  : 'Task',
                color:
                  'bg-amber-500',
              },
              {
                label: isPersian
                  ? 'هدف'
                  : 'Goal',
                color:
                  'bg-violet-500',
              },
            ].map((legend) => (
              <div
                key={legend.label}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <span
                  className={`h-2 w-2 rounded-full ${legend.color}`}
                />
                {legend.label}
              </div>
            ))}
          </div>
        </section>

        <aside
          className={`
            h-fit overflow-hidden
            rounded-3xl border
            ${
              isDark
                ? 'border-slate-800 bg-slate-900'
                : 'border-slate-200 bg-white'
            }
          `}
        >
          <div
            className={`
              border-b p-5
              ${
                isDark
                  ? 'border-slate-800'
                  : 'border-slate-100'
              }
            `}
          >
            <div className="flex items-center gap-2 text-blue-500">
              <CalendarDays size={18} />

              <span className="text-xs font-semibold">
                {isPersian
                  ? 'روز انتخاب‌شده'
                  : 'Selected day'}
              </span>
            </div>

            <h3
              className={`
                mt-3 text-xl font-bold
                ${
                  isDark
                    ? 'text-white'
                    : 'text-slate-900'
                }
              `}
            >
              {formatSelectedDate()}
            </h3>

            {selectedDate ===
              todayDate && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                <Circle
                  size={7}
                  fill="currentColor"
                />
                {isPersian
                  ? 'امروز'
                  : 'Today'}
              </div>
            )}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className={`
                        h-20 animate-pulse
                        rounded-2xl
                        ${
                          isDark
                            ? 'bg-slate-800'
                            : 'bg-slate-100'
                        }
                      `}
                    />
                  ),
                )}
              </div>
            ) : selectedItems.length ===
              0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div
                  className={`
                    mb-4 flex h-14 w-14
                    items-center justify-center
                    rounded-2xl
                    ${
                      isDark
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  <CalendarDays size={24} />
                </div>

                <p
                  className={`
                    font-semibold
                    ${
                      isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    }
                  `}
                >
                  {isPersian
                    ? 'برنامه‌ای برای این روز نیست'
                    : 'Nothing planned'}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {isPersian
                    ? 'رویدادها، کارها، فعالیت‌ها و هدف‌ها اینجا نمایش داده می‌شوند.'
                    : 'Events, tasks, activities and goals will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(
                  (item) => (
                    <div
                      key={item.id}
                      className={`
                        group rounded-2xl
                        border p-4
                        transition-all duration-200
                        hover:-translate-y-0.5
                        ${
                          isDark
                            ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/70'
                            : 'border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              `${getItemTone(item)}18`,
                            color:
                              getItemTone(
                                item,
                              ),
                          }}
                        >
                          {getItemIcon(
                            item.type,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`
                                text-sm font-semibold
                                ${
                                  item.completed
                                    ? 'line-through opacity-50'
                                    : ''
                                }
                                ${
                                  isDark
                                    ? 'text-slate-200'
                                    : 'text-slate-800'
                                }
                              `}
                            >
                              {item.title}
                            </p>

                            {item.completed && (
                              <CheckCircle2
                                size={16}
                                className="shrink-0 text-emerald-500"
                              />
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor:
                                  `${getItemTone(item)}18`,
                                color:
                                  getItemTone(
                                    item,
                                  ),
                              }}
                            >
                              {getItemLabel(
                                item.type,
                              )}
                            </span>

                            {item.allDay ? (
                              <span className="text-[10px] text-slate-500">
                                {isPersian
                                  ? 'تمام روز'
                                  : 'All day'}
                              </span>
                            ) : (
                              item.time && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <Clock3 size={11} />
                                  {item.time}
                                  {item.endTime
                                    ? ` - ${item.endTime}`
                                    : ''}
                                </span>
                              )
                            )}

                            {item.location && (
                              <span className="flex min-w-0 items-center gap-1 text-[10px] text-slate-500">
                                <MapPin
                                  size={11}
                                />
                                <span className="max-w-[170px] truncate">
                                  {item.location}
                                </span>
                              </span>
                            )}
                          </div>

                          {item.type ===
                            'event' &&
                            item.category && (
                            <p className="mt-2 truncate text-[10px] text-slate-400">
                              {item.category}
                            </p>
                          )}

                          {item.type ===
                            'event' &&
                            item.description && (
                            <p
                              className={`
                                mt-2 line-clamp-2
                                text-xs leading-5
                                ${
                                  isDark
                                    ? 'text-slate-500'
                                    : 'text-slate-400'
                                }
                              `}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {selectedItems.length > 0 && (
              <div
                className={`
                  mt-4 flex items-center
                  justify-between rounded-2xl
                  px-4 py-3
                  ${
                    isDark
                      ? 'bg-slate-800/70'
                      : 'bg-slate-50'
                  }
                `}
              >
                <span className="text-xs text-slate-500">
                  {isPersian
                    ? 'تعداد برنامه‌ها'
                    : 'Total items'}
                </span>

                <span
                  className={`
                    text-sm font-bold
                    ${
                      isDark
                        ? 'text-white'
                        : 'text-slate-900'
                    }
                  `}
                >
                  {selectedItems.length}
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
