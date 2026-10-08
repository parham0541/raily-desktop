import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Languages,
  Palette,
} from 'lucide-react'

import {
  useLanguage,
  type Theme,
} from '../i18n/LanguageContext'

import type { Language } from '../i18n'

import {
  toGregorian,
  toJalaali,
} from 'jalaali-js'

type DateMode =
  | 'system'
  | 'manual'
  | 'server'

type ServerClockStatus = {
  synchronized?: boolean
  sourceCount?: number
  confidence?: 'high' | 'low' | string
  sources?: string[]
  error?: string
}

type ServerClockResult = {
  ok?: boolean
  timestamp?: number
  serverClock?: ServerClockStatus
  synchronized?: boolean
  sourceCount?: number
  confidence?: 'high' | 'low' | string
  sources?: string[]
  error?: string
}

type RailyClockApi = {
  get: () => Promise<ServerClockResult>
  sync: () => Promise<ServerClockResult>
}

type JalaliDate = {
  jy: number
  jm: number
  jd: number
}

const persianMonths = [
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

const persianWeekDays = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
]

function getTodayJalali(): JalaliDate {
  const today = new Date()

  const result = toJalaali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  )

  return {
    jy: result.jy,
    jm: result.jm,
    jd: result.jd,
  }
}

function getDaysInJalaliMonth(
  year: number,
  month: number,
) {
  if (month <= 6) {
    return 31
  }

  if (month <= 11) {
    return 30
  }

  const nextYear =
    month === 12
      ? year + 1
      : year

  const nextMonth =
    month === 12
      ? 1
      : month + 1

  const current =
    toGregorian(
      year,
      month,
      1,
    )

  const next =
    toGregorian(
      nextYear,
      nextMonth,
      1,
    )

  const currentDate =
    new Date(
      current.gy,
      current.gm - 1,
      current.gd,
    )

  const nextDate =
    new Date(
      next.gy,
      next.gm - 1,
      next.gd,
    )

  return Math.round(
    (nextDate.getTime() -
      currentDate.getTime()) /
      86400000,
  )
}

function getFirstDayOffset(
  year: number,
  month: number,
) {
  const gregorian =
    toGregorian(
      year,
      month,
      1,
    )

  const date =
    new Date(
      gregorian.gy,
      gregorian.gm - 1,
      gregorian.gd,
    )

  const day =
    date.getDay()

  return (day + 1) % 7
}

function formatJalaliDate(
  date: JalaliDate,
) {
  return `${date.jy}-${String(
    date.jm,
  ).padStart(
    2,
    '0',
  )}-${String(
    date.jd,
  ).padStart(
    2,
    '0',
  )}`
}

function parseJalaliDate(
  value: string | null,
): JalaliDate | null {
  if (!value) {
    return null
  }

  const parts =
    value.split('-').map(Number)

  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        Number.isNaN(part),
    )
  ) {
    return null
  }

  return {
    jy: parts[0],
    jm: parts[1],
    jd: parts[2],
  }
}

function getPersianDateLabel(
  date: JalaliDate,
) {
  return `${date.jd} ${persianMonths[date.jm - 1]} ${date.jy}`
}

function getManualClockValue(
  dateValue: string,
  timeValue: string,
  savedAt: number,
) {
  const parsedDate =
    parseJalaliDate(
      dateValue,
    )

  if (!parsedDate) {
    return ''
  }

  const timeParts =
    timeValue
      .split(':')
      .map(Number)

  const hours = timeParts[0]
  const minutes = timeParts[1]

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return ''
  }

  const gregorian =
    toGregorian(
      parsedDate.jy,
      parsedDate.jm,
      parsedDate.jd,
    )

  const baseDate =
    new Date(
      gregorian.gy,
      gregorian.gm - 1,
      gregorian.gd,
      hours,
      minutes,
      0,
      0,
    )

  const elapsed =
    Math.max(
      0,
      Date.now() - savedAt,
    )

  const currentDate =
    new Date(
      baseDate.getTime() +
        elapsed,
    )

  return `${String(
    currentDate.getHours(),
  ).padStart(
    2,
    '0',
  )}:${String(
    currentDate.getMinutes(),
  ).padStart(
    2,
    '0',
  )}:${String(
    currentDate.getSeconds(),
  ).padStart(
    2,
    '0',
  )}`
}

function Settings() {
  const {
    language,
    theme,
    setLanguage,
    setTheme,
    t,
  } = useLanguage()

  const today =
    getTodayJalali()

  // Keep this page compatible with the preload clock API while its global
  // TypeScript declaration is updated to include clock.sync() and serverClock.
  const clockApi = window.raily.clock as unknown as RailyClockApi

  const [dateMode, setDateMode] =
    useState<DateMode>('system')

  const [manualDate, setManualDate] =
    useState('')

  const [manualTime, setManualTime] =
    useState('')

  const [manualSavedAt, setManualSavedAt] =
    useState<number | null>(null)

  const [manualClock, setManualClock] =
    useState('')

  const [calendarOpen, setCalendarOpen] =
    useState(false)

  const [calendarYear, setCalendarYear] =
    useState(today.jy)

  const [calendarMonth, setCalendarMonth] =
    useState(today.jm)

  const [selectedDate, setSelectedDate] =
    useState<JalaliDate | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [saved, setSaved] =
    useState(false)

  const [serverClock, setServerClock] =
    useState<any>(null)

  const [serverClockDisplay, setServerClockDisplay] =
    useState('--:--:--')

  const [serverDateDisplay, setServerDateDisplay] =
    useState('')

  const [clockSyncing, setClockSyncing] =
    useState(false)

  const [serverClockError, setServerClockError] =
    useState('')

  const calendarRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings =
          await window.raily.settings.get()

        if (!settings) {
          return
        }

        if (
          settings.dateMode === 'system' ||
          settings.dateMode === 'manual' ||
          settings.dateMode === 'server'
        ) {
          setDateMode(
            settings.dateMode,
          )
        }

        const savedDate =
          parseJalaliDate(
            settings.manualDate,
          )

        if (savedDate) {
          const formattedDate =
            formatJalaliDate(
              savedDate,
            )

          setManualDate(
            formattedDate,
          )

          setSelectedDate(
            savedDate,
          )

          setCalendarYear(
            savedDate.jy,
          )

          setCalendarMonth(
            savedDate.jm,
          )
        } else {
          const formattedDate =
            formatJalaliDate(
              today,
            )

          setManualDate(
            formattedDate,
          )

          setSelectedDate(
            today,
          )
        }

        setManualTime(
          settings.manualTime ||
            new Date()
              .toTimeString()
              .slice(
                0,
                5,
              ),
        )

        setManualSavedAt(
          settings.updatedAt,
        )
      } catch (error) {
        console.error(
          'Failed to load settings:',
          error,
        )

        setError(
          'Unable to load settings.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    if (
      dateMode !== 'manual' ||
      manualSavedAt === null
    ) {
      return
    }

    const savedAt =
      manualSavedAt

    function updateManualClock() {
      const value =
        getManualClockValue(
          manualDate,
          manualTime,
          savedAt,
        )

      setManualClock(value)
    }

    updateManualClock()

    const interval =
      window.setInterval(
        updateManualClock,
        1000,
      )

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [
    dateMode,
    manualDate,
    manualTime,
    manualSavedAt,
  ])

  useEffect(() => {
    if (dateMode !== 'server') {
      setServerClockError('')
      return
    }

    let active = true

    const updateServerClock = async () => {
      try {
        const result = await clockApi.get()

        if (!active) return

        const status = result?.serverClock ?? null
        setServerClock(status)

        if (!status?.synchronized) {
          setServerClockError(
            status?.error ||
              (language === 'fa'
                ? 'همگام‌سازی ساعت ایران انجام نشده است.'
                : 'Iran server time is not synchronized.'),
          )
          return
        }

        setServerClockError('')

        const timestamp = Number(result?.timestamp)
        if (!Number.isFinite(timestamp)) {
          setServerClockError(
            language === 'fa'
              ? 'زمان دریافتی معتبر نیست.'
              : 'The received time is invalid.',
          )
          return
        }

        const date = new Date(timestamp)
        setServerClockDisplay(
          new Intl.DateTimeFormat(
            language === 'fa' ? 'fa-IR' : 'en-GB',
            {
              timeZone: 'Asia/Tehran',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            },
          ).format(date),
        )
        setServerDateDisplay(
          new Intl.DateTimeFormat(
            language === 'fa' ? 'fa-IR' : 'en-GB',
            {
              timeZone: 'Asia/Tehran',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            },
          ).format(date),
        )
      } catch (error) {
        if (!active) return
        setServerClockError(
          error instanceof Error
            ? error.message
            : language === 'fa'
              ? 'دریافت ساعت سرور ناموفق بود.'
              : 'Could not retrieve server time.',
        )
      }
    }

    void updateServerClock()
    const interval = window.setInterval(() => {
      void updateServerClock()
    }, 1000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [dateMode, language])

  async function handleServerClockSync() {
    setClockSyncing(true)
    setServerClockError('')

    try {
      const result = await clockApi.sync()

      if (!result?.ok) {
        throw new Error(
          result?.error ||
            (language === 'fa'
              ? 'همگام‌سازی ساعت ناموفق بود.'
              : 'Clock synchronization failed.'),
        )
      }

      setServerClock(result)
      showSaved()
    } catch (error) {
      setServerClockError(
        error instanceof Error
          ? error.message
          : language === 'fa'
            ? 'همگام‌سازی ساعت ناموفق بود.'
            : 'Clock synchronization failed.',
      )
    } finally {
      setClockSyncing(false)
    }
  }

  useEffect(() => {
    if (!calendarOpen) {
      return
    }

    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(
          event.target as Node,
        )
      ) {
        setCalendarOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [calendarOpen])

  function showSaved() {
    setSaved(true)

    window.setTimeout(() => {
      setSaved(false)
    }, 1500)
  }

  async function handleLanguageChange(
    nextLanguage: Language,
  ) {
    setError('')

    try {
      await setLanguage(
        nextLanguage,
      )

      showSaved()
    } catch (error) {
      console.error(
        'Failed to save language:',
        error,
      )

      setError(
        'Unable to save language.',
      )
    }
  }

  async function handleThemeChange(
    nextTheme: Theme,
  ) {
    setError('')

    try {
      await setTheme(
        nextTheme,
      )

      showSaved()
    } catch (error) {
      console.error(
        'Failed to save theme:',
        error,
      )

      setError(
        'Unable to save theme.',
      )
    }
  }

  async function handleDateModeChange(
    nextDateMode: DateMode,
  ) {
    setError('')
    setServerClockError('')

    try {
      await window.raily.settings.update({
        dateMode: nextDateMode,
      })

      setDateMode(nextDateMode)
      showSaved()

      if (nextDateMode === 'server') {
        setClockSyncing(true)

        try {
          const result = await clockApi.sync()

          if (!result?.ok) {
            setServerClockError(
              result?.error ||
                (language === 'fa'
                  ? 'تنظیم ذخیره شد اما دریافت ساعت ایران ناموفق بود.'
                  : 'Settings were saved, but Iran time synchronization failed.'),
            )
          } else {
            setServerClock(result)
          }
        } finally {
          setClockSyncing(false)
        }
      }
    } catch (error) {
      console.error(
        'Failed to save date mode:',
        error,
      )

      setError(
        language === 'fa'
          ? 'ذخیره حالت تاریخ و ساعت ناموفق بود.'
          : 'Unable to save date mode.',
      )
    }
  }

  function handleDateSelect(
    date: JalaliDate,
  ) {
    const value =
      formatJalaliDate(date)

    setSelectedDate(date)
    setManualDate(value)
    setCalendarOpen(false)
  }

  function previousMonth() {
    if (calendarMonth === 1) {
      setCalendarMonth(12)
      setCalendarYear(
        calendarYear - 1,
      )
      return
    }

    setCalendarMonth(
      calendarMonth - 1,
    )
  }

  function nextMonth() {
    if (calendarMonth === 12) {
      setCalendarMonth(1)
      setCalendarYear(
        calendarYear + 1,
      )
      return
    }

    setCalendarMonth(
      calendarMonth + 1,
    )
  }

  async function handleManualSave() {
    if (
      !selectedDate ||
      !manualDate ||
      !manualTime
    ) {
      setError(
        'Please select a date and time.',
      )
      return
    }

    setError('')
    setSaving(true)

    try {
      const updated =
        await window.raily.settings.update({
          dateMode: 'manual',
          manualDate,
          manualTime,
        })

      setDateMode('manual')

      setManualSavedAt(
        updated.updatedAt,
      )

      setManualClock(
        getManualClockValue(
          manualDate,
          manualTime,
          updated.updatedAt,
        ),
      )

      showSaved()
    } catch (error) {
      console.error(
        'Failed to save manual date and time:',
        error,
      )

      setError(
        'Unable to save manual date and time.',
      )
    } finally {
      setSaving(false)
    }
  }

  const daysInMonth =
    getDaysInJalaliMonth(
      calendarYear,
      calendarMonth,
    )

  const firstDayOffset =
    getFirstDayOffset(
      calendarYear,
      calendarMonth,
    )

  const calendarDays =
    Array.from(
      {
        length:
          firstDayOffset +
          daysInMonth,
      },
      (_, index) => {
        if (
          index < firstDayOffset
        ) {
          return null
        }

        return (
          index -
          firstDayOffset +
          1
        )
      },
    )

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f7f9fc] dark:bg-[#07111f]">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Loading settings...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f7f9fc] px-6 py-8 transition-colors duration-200 dark:bg-[#07111f] lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.settings.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t.settings.profileDescription}
              </p>
            </div>

            <div
              className={`flex items-center gap-2 text-sm font-medium transition-opacity duration-200 ${
                saved
                  ? 'opacity-100'
                  : 'opacity-0'
              } text-emerald-600 dark:text-emerald-400`}
            >
              <Check size={16} />
              Saved
            </div>
          </div>
        </header>

        <div className="space-y-6">

          {/* Language */}
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white transition-colors duration-200 dark:border-[#1c3049] dark:bg-[#0c1b2d]">
            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-[#1c3049]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Languages size={20} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.common.language}
                </h2>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Choose the application language.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <OptionButton
                selected={
                  language === 'en'
                }
                onClick={() =>
                  handleLanguageChange(
                    'en',
                  )
                }
                title={
                  t.common.english
                }
                description="Use English throughout Raily."
              />

              <OptionButton
                selected={
                  language === 'fa'
                }
                onClick={() =>
                  handleLanguageChange(
                    'fa',
                  )
                }
                title={
                  t.common.persian
                }
                description="استفاده از زبان فارسی در Raily."
              />
            </div>
          </section>

          {/* Appearance */}
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white transition-colors duration-200 dark:border-[#1c3049] dark:bg-[#0c1b2d]">
            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-[#1c3049]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Palette size={20} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.settings.appearance}
                </h2>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Choose how Raily looks.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3">
              <OptionButton
                selected={
                  theme === 'system'
                }
                onClick={() =>
                  handleThemeChange(
                    'system',
                  )
                }
                title={
                  t.settings.system
                }
                description="Follow your operating system."
              />

              <OptionButton
                selected={
                  theme === 'light'
                }
                onClick={() =>
                  handleThemeChange(
                    'light',
                  )
                }
                title={
                  t.settings.light
                }
                description="Use the light theme."
              />

              <OptionButton
                selected={
                  theme === 'dark'
                }
                onClick={() =>
                  handleThemeChange(
                    'dark',
                  )
                }
                title={
                  t.settings.dark
                }
                description="Use the dark theme."
              />
            </div>
          </section>

          {/* Date & Time */}
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white transition-colors duration-200 dark:border-[#1c3049] dark:bg-[#0c1b2d]">
            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-[#1c3049]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Date & Time
                </h2>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Choose the source of your date and time.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3">
              <OptionButton
                selected={
                  dateMode === 'system'
                }
                onClick={() =>
                  handleDateModeChange(
                    'system',
                  )
                }
                title="System"
                description="Use your computer date and time."
              />

              <OptionButton
                selected={
                  dateMode === 'manual'
                }
                onClick={() =>
                  handleDateModeChange(
                    'manual',
                  )
                }
                title="Manual"
                description="Set a custom date and time."
              />

              <OptionButton
                selected={
                  dateMode === 'server'
                }
                onClick={() =>
                  handleDateModeChange(
                    'server',
                  )
                }
                title="Iran Server"
                description="Use server time."
              />
            </div>

            {dateMode === 'system' && (
              <div className="mx-6 mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#1c3049] dark:bg-[#0a1727]">
                <div className="flex items-start gap-3">
                  <Clock
                    size={18}
                    className="mt-0.5 text-slate-500 dark:text-slate-400"
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      System date & time
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                      Raily will use the date and time provided by your operating system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {dateMode === 'manual' && (
              <div className="mx-6 mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-500/5">

                <div className="mb-5">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Manual date & time
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Select a Persian date and set the starting time.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Date picker */}
                  <div ref={calendarRef}>
                    <label
                      htmlFor="manual-date"
                      className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Date
                    </label>

                    <div className="relative">
                      <button
                        id="manual-date"
                        type="button"
                        onClick={() =>
                          setCalendarOpen(
                            (open) =>
                              !open,
                          )
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-[#263b57] dark:bg-[#0c1b2d] dark:text-slate-200 dark:hover:border-blue-500"
                      >
                        <span>
                          {selectedDate
                            ? getPersianDateLabel(
                                selectedDate,
                              )
                            : 'Select date'}
                        </span>

                        <CalendarDays
                          size={17}
                          className="text-slate-400"
                        />
                      </button>

                      {calendarOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-[#263b57] dark:bg-[#0c1b2d]">

                          <div className="mb-4 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={
                                previousMonth
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#14263b]"
                            >
                              <ChevronLeft
                                size={18}
                              />
                            </button>

                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {
                                persianMonths[
                                  calendarMonth -
                                    1
                                ]
                              }{' '}
                              {calendarYear}
                            </div>

                            <button
                              type="button"
                              onClick={
                                nextMonth
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#14263b]"
                            >
                              <ChevronRight
                                size={18}
                              />
                            </button>
                          </div>

                          <div className="mb-2 grid grid-cols-7 gap-1">
                            {persianWeekDays.map(
                              (day) => (
                                <div
                                  key={day}
                                  className="py-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500"
                                >
                                  {day}
                                </div>
                              ),
                            )}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(
                              (
                                day,
                                index,
                              ) => {
                                if (
                                  day ===
                                  null
                                ) {
                                  return (
                                    <div
                                      key={`empty-${index}`}
                                      className="h-9"
                                    />
                                  )
                                }

                                const isSelected =
                                  selectedDate?.jy ===
                                    calendarYear &&
                                  selectedDate?.jm ===
                                    calendarMonth &&
                                  selectedDate?.jd ===
                                    day

                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() =>
                                      handleDateSelect(
                                        {
                                          jy: calendarYear,
                                          jm: calendarMonth,
                                          jd: day,
                                        },
                                      )
                                    }
                                    className={`h-9 rounded-lg text-xs font-medium transition ${
                                      isSelected
                                        ? 'bg-blue-500 text-white dark:bg-blue-500'
                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                )
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label
                      htmlFor="manual-time"
                      className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Time
                    </label>

                    <input
                      id="manual-time"
                      type="time"
                      value={manualTime}
                      onChange={(
                        event,
                      ) =>
                        setManualTime(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-[#263b57] dark:bg-[#0c1b2d] dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Live clock */}
                <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-4 dark:border-blue-900/50 dark:bg-[#0c1b2d]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <Clock size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {language === 'fa'
                          ? 'ساعت فعلی'
                          : 'Current time'}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {language === 'fa'
                          ? 'ثانیه به صورت زنده در حال حرکت است.'
                          : 'Seconds update automatically.'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-2xl font-bold tabular-nums tracking-wider text-blue-600 dark:text-blue-400">
                    {manualClock ||
                      '--:--:--'}
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      handleManualSave
                    }
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={16} />

                    {saving
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {dateMode === 'server' && (
              <div className="mx-6 mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#1c3049] dark:bg-[#0a1727]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Clock
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {language === 'fa' ? 'ساعت سرور ایران' : 'Iran server time'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {language === 'fa'
                          ? 'زمان از منابع اینترنتی دریافت و با منطقه زمانی تهران نمایش داده می‌شود.'
                          : 'Time is synchronized from internet sources and displayed in the Tehran time zone.'}
                      </p>

                      {serverDateDisplay && (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          {serverDateDisplay}
                        </p>
                      )}

                      <p className="mt-1 text-3xl font-bold tabular-nums tracking-wide text-blue-600 dark:text-blue-400">
                        {serverClockDisplay}
                      </p>

                      {serverClock?.synchronized && (
                        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                          {language === 'fa'
                            ? `همگام‌سازی موفق · ${serverClock.sourceCount ?? 0} منبع · اطمینان ${serverClock.confidence === 'high' ? 'بالا' : 'پایین'}`
                            : `Synchronized · ${serverClock.sourceCount ?? 0} source(s) · ${serverClock.confidence === 'high' ? 'high' : 'low'} confidence`}
                        </p>
                      )}

                      {serverClockError && (
                        <p role="alert" className="mt-2 text-xs leading-5 text-red-600 dark:text-red-400">
                          {serverClockError}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleServerClockSync}
                    disabled={clockSyncing}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Clock size={15} />
                    {clockSyncing
                      ? (language === 'fa' ? 'در حال همگام‌سازی...' : 'Synchronizing...')
                      : (language === 'fa' ? 'همگام‌سازی دوباره' : 'Sync now')}
                  </button>
                </div>

                {serverClock?.sources?.length > 0 && (
                  <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 dark:border-[#1c3049] dark:text-slate-400">
                    {language === 'fa' ? 'منابع استفاده‌شده: ' : 'Sources used: '}
                    {serverClock.sources.join(', ')}
                  </p>
                )}
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-500/5 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type OptionButtonProps = {
  selected: boolean
  onClick: () => void
  title: string
  description: string
}

function OptionButton({
  selected,
  onClick,
  title,
  description,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-500/10'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-[#263b57] dark:bg-[#0a1727] dark:hover:border-blue-500/50 dark:hover:bg-[#0c1b2d]'
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
          <Check size={12} />
        </div>
      )}

      <p className="pr-7 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
        {description}
      </p>
    </button>
  )
}

export default Settings