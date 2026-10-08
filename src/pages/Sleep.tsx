import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BedDouble,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Moon,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react'
import { toJalaali } from 'jalaali-js'

import { useLanguage } from '../i18n/LanguageContext'
import JalaliDatePicker from '../components/JalaliDatePicker'

interface SleepRecord {
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

interface SleepForm {
  sleepDate: string
  bedtime: string
  wakeTime: string
  quality: number
  note: string
}

interface SleepApi {
  get: () => Promise<SleepRecord[]>
  create: (record: SleepForm & { duration?: number }) => Promise<SleepRecord>
  update: (
    id: number,
    updates: Partial<SleepForm> & { duration?: number },
  ) => Promise<SleepRecord>
  delete: (id: number) => Promise<unknown>
}

function getSleepApi(): SleepApi {
  return (window.raily as unknown as { sleep: SleepApi }).sleep
}

function getTodayJalali(): string {
  const jalali = toJalaali(new Date())

  return [
    jalali.jy,
    String(jalali.jm).padStart(2, '0'),
    String(jalali.jd).padStart(2, '0'),
  ].join('-')
}

function calculateDuration(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) {
    return 0
  }

  const [bedHour, bedMinute] = bedtime.split(':').map(Number)
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number)

  if (
    [bedHour, bedMinute, wakeHour, wakeMinute].some((value) =>
      Number.isNaN(value),
    )
  ) {
    return 0
  }

  const bedtimeMinutes = bedHour * 60 + bedMinute
  const wakeMinutes = wakeHour * 60 + wakeMinute

  let duration = wakeMinutes - bedtimeMinutes

  if (duration <= 0) {
    duration += 24 * 60
  }

  return duration
}

function formatDuration(minutes: number, isPersian: boolean): string {
  const safeMinutes = Math.max(0, Math.round(minutes || 0))
  const hours = Math.floor(safeMinutes / 60)
  const remaining = safeMinutes % 60

  if (isPersian) {
    if (hours === 0) return `${remaining} دقیقه`
    if (remaining === 0) return `${hours} ساعت`
    return `${hours} ساعت و ${remaining} دقیقه`
  }

  if (hours === 0) return `${remaining} min`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

function formatDate(date: string, isPersian: boolean): string {
  if (!date) return '—'

  const [year, month, day] = date.split('-').map(Number)

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return date
  }

  return isPersian
    ? `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    : `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}

function getQualityLabel(quality: number, isPersian: boolean): string {
  const labels = isPersian
    ? ['خیلی بد', 'بد', 'متوسط', 'خوب', 'عالی']
    : ['Very bad', 'Bad', 'Average', 'Good', 'Excellent']

  return labels[Math.min(5, Math.max(1, quality)) - 1]
}

function createEmptyForm(): SleepForm {
  return {
    sleepDate: getTodayJalali(),
    bedtime: '23:00',
    wakeTime: '07:00',
    quality: 3,
    note: '',
  }
}

function SleepQuality({
  value,
  onChange,
  isPersian,
}: {
  value: number
  onChange: (value: number) => void
  isPersian: boolean
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {isPersian ? 'کیفیت خواب' : 'Sleep quality'}
        </label>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
          {getQualityLabel(value, isPersian)}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((quality) => {
          const active = quality === value

          return (
            <button
              key={quality}
              type="button"
              onClick={() => onChange(quality)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition ${
                active
                  ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
              }`}
              aria-label={getQualityLabel(quality, isPersian)}
            >
              <Star
                size={15}
                fill={active ? 'currentColor' : 'none'}
              />
              <span>{quality}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Sleep() {
  const { language, theme } = useLanguage()
  const isPersian = language === 'fa'
  const isDark = theme === 'dark'

  const [records, setRecords] = useState<SleepRecord[]>([])
  const [form, setForm] = useState<SleepForm>(createEmptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getSleepApi().get()
      setRecords(result)
    } catch (err) {
      console.error(err)
      setError(
        isPersian
          ? 'دریافت اطلاعات خواب انجام نشد.'
          : 'Failed to load sleep records.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  const durationPreview = calculateDuration(
    form.bedtime,
    form.wakeTime,
  )

  const totalNights = records.length

  const averageDuration =
    records.length > 0
      ? Math.round(
          records.reduce(
            (total, record) => total + Number(record.duration || 0),
            0,
          ) / records.length,
        )
      : 0

  const averageQuality =
    records.length > 0
      ? records.reduce(
          (total, record) => total + Number(record.quality || 0),
          0,
        ) / records.length
      : 0

  const lastSeven = records.slice(0, 7)

  const goodNights = records.filter(
    (record) => record.duration >= 7 * 60 && record.duration <= 9 * 60,
  ).length

  const sleepScore =
    records.length > 0
      ? Math.round(
          Math.min(
            100,
            (averageQuality / 5) * 55 +
              Math.min(1, averageDuration / (8 * 60)) * 45,
          ),
        )
      : 0

  const recentAverage = useMemo(() => {
    if (!lastSeven.length) return 0

    return Math.round(
      lastSeven.reduce(
        (total, record) => total + Number(record.duration || 0),
        0,
      ) / lastSeven.length,
    )
  }, [lastSeven])

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (record: SleepRecord) => {
    setForm({
      sleepDate: record.sleepDate,
      bedtime: record.bedtime,
      wakeTime: record.wakeTime,
      quality: record.quality,
      note: record.note ?? '',
    })
    setEditingId(record.id)
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.sleepDate || !form.bedtime || !form.wakeTime) {
      setError(
        isPersian
          ? 'تاریخ و زمان خواب و بیداری را کامل کنید.'
          : 'Please complete the date, bedtime and wake time.',
      )
      return
    }

    const duration = calculateDuration(
      form.bedtime,
      form.wakeTime,
    )

    if (duration <= 0 || duration > 24 * 60) {
      setError(
        isPersian
          ? 'بازه زمانی خواب معتبر نیست.'
          : 'The sleep time range is not valid.',
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        sleepDate: form.sleepDate,
        bedtime: form.bedtime,
        wakeTime: form.wakeTime,
        quality: form.quality,
        note: form.note.trim(),
        duration,
      }

      if (editingId !== null) {
        await getSleepApi().update(editingId, payload)
      } else {
        await getSleepApi().create(payload)
      }

      await loadRecords()
      resetForm()
    } catch (err) {
      console.error(err)
      setError(
        isPersian
          ? 'ذخیره اطلاعات خواب انجام نشد.'
          : 'Failed to save the sleep record.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      isPersian
        ? 'آیا از حذف این رکورد خواب مطمئن هستید؟'
        : 'Are you sure you want to delete this sleep record?',
    )

    if (!confirmed) return

    try {
      setError('')
      await getSleepApi().delete(id)
      await loadRecords()

      if (editingId === id) {
        resetForm()
      }
    } catch (err) {
      console.error(err)
      setError(
        isPersian
          ? 'حذف رکورد خواب انجام نشد.'
          : 'Failed to delete the sleep record.',
      )
    }
  }

  const setTimePreset = (bedtime: string, wakeTime: string) => {
    setForm((current) => ({
      ...current,
      bedtime,
      wakeTime,
    }))
  }

  return (
    <div className="sleep-page-shell">
      <style>{`
        @keyframes sleep-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sleep-pop {
          0% { transform: scale(.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .sleep-page-enter { animation: sleep-fade-up .45s ease-out both; }
        .sleep-pop { animation: sleep-pop .35s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .sleep-page-enter, .sleep-pop { animation: none !important; }
        }
      `}</style>
      <div
      className="sleep-page-enter min-h-full overflow-x-hidden bg-transparent px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      dir={isPersian ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-600/25 transition duration-300 hover:scale-105 hover:rotate-2 sm:h-14 sm:w-14">
                <Moon size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isPersian ? 'استراحت و خواب' : 'Rest & Sleep'}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'خواب شبانه‌ات را ثبت و روند استراحتت را بررسی کن.'
                    : 'Track your sleep and understand your rest patterns.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur sm:flex dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <Sparkles size={14} />
              {isPersian ? 'حال خوب از خواب خوب شروع می‌شود' : 'Better rest, better days'}
            </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            {isPersian ? 'ثبت خواب' : 'Log sleep'}
          </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-900/30"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isPersian ? 'میانگین خواب' : 'Average sleep'}
              </span>
              <Clock3 className="text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:text-blue-400" size={20} />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatDuration(averageDuration, isPersian)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isPersian
                ? `بر اساس ${totalNights} شب ثبت‌شده`
                : `Based on ${totalNights} logged nights`}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isPersian ? 'کیفیت میانگین' : 'Average quality'}
              </span>
              <Star className="text-amber-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" size={20} />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {records.length ? averageQuality.toFixed(1) : '—'}
              <span className="ml-1 text-sm font-medium text-slate-400">
                / 5
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {records.length
                ? getQualityLabel(
                    Math.round(averageQuality),
                    isPersian,
                  )
                : isPersian
                  ? 'هنوز داده‌ای نیست'
                  : 'No data yet'}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isPersian ? 'خواب مناسب' : 'Healthy nights'}
              </span>
              <Check className="text-emerald-500 transition-transform duration-300 group-hover:scale-110" size={20} />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {goodNights}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'بین ۷ تا ۹ ساعت'
                : 'Between 7 and 9 hours'}
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isPersian ? 'امتیاز خواب' : 'Sleep score'}
              </span>
              <TrendingUp className="text-violet-500 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" size={20} />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {sleepScore}
              <span className="ml-1 text-sm font-medium text-slate-400">
                / 100
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'بر اساس مدت و کیفیت'
                : 'Based on duration and quality'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isPersian ? 'آخرین خواب‌ها' : 'Recent sleep'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'آخرین رکوردهای ثبت‌شده را اینجا می‌بینی.'
                    : 'Your latest logged sleep records.'}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <Activity size={15} />
                {isPersian
                  ? `میانگین ۷ رکورد اخیر: ${formatDuration(recentAverage, true)}`
                  : `Recent average: ${formatDuration(recentAverage, false)}`}
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <BedDouble size={26} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  {isPersian
                    ? 'هنوز خواب ثبت نشده'
                    : 'No sleep records yet'}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'اولین خواب شبانه‌ات را ثبت کن تا Raily روند استراحتت را دنبال کند.'
                    : 'Log your first night so Raily can start tracking your rest.'}
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  {isPersian ? 'ثبت اولین خواب' : 'Log your first sleep'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/10"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <Moon size={21} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formatDate(record.sleepDate, isPersian)}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {getQualityLabel(record.quality, isPersian)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <BedDouble size={15} />
                              {record.bedtime}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">
                              →
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={15} />
                              {record.wakeTime}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {formatDuration(record.duration, isPersian)}
                            </span>
                          </div>

                          {record.note && (
                            <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {record.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 items-center gap-2 self-stretch sm:w-auto sm:self-end lg:self-center">
                        <button
                          type="button"
                          onClick={() => openEdit(record)}
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit3 size={15} />
                          {isPersian ? 'ویرایش' : 'Edit'}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(record.id)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-500 sm:flex-none transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:hover:bg-red-950/20"
                          aria-label={isPersian ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-5 dark:border-slate-800 dark:bg-[#0b1728]/90 dark:hover:border-blue-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <CalendarDays size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  {isPersian ? 'راهنمای خواب' : 'Sleep guide'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'یک تصویر سریع از وضعیتت'
                    : 'A quick view of your pattern'}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isPersian ? 'میانگین مدت' : 'Average duration'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDuration(averageDuration, isPersian)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (averageDuration / (9 * 60)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isPersian ? 'کیفیت' : 'Quality'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {records.length
                      ? `${averageQuality.toFixed(1)} / 5`
                      : '—'}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (averageQuality / 5) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                    <Moon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isPersian
                        ? 'هدف ساده'
                        : 'Simple target'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {isPersian
                        ? 'سعی کن بیشتر شب‌ها حدود ۷ تا ۹ ساعت خواب ثبت کنی.'
                        : 'Aim for around 7–9 hours on most nights.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <TrendingUp
                  size={19}
                  className="shrink-0 text-blue-600 dark:text-blue-400"
                />
                <p className="text-xs leading-5 text-blue-700 dark:text-blue-300">
                  {isPersian
                    ? 'با ثبت منظم خواب، گزارش‌های آینده Raily می‌توانند الگوی استراحتت را بهتر نشان دهند.'
                    : 'Regular sleep logs will make future Raily reports much more useful.'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                resetForm()
              }
            }}
          >
            <div
              className={`sleep-pop w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${
                isDark
                  ? 'border-slate-700 bg-[#0b1728]'
                  : 'border-slate-200 bg-white'
              }`}
              dir={isPersian ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                    <BedDouble size={19} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">
                      {editingId !== null
                        ? isPersian
                          ? 'ویرایش خواب'
                          : 'Edit sleep'
                        : isPersian
                          ? 'ثبت خواب'
                          : 'Log sleep'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isPersian
                        ? 'زمان خواب، بیداری و کیفیت را ثبت کن.'
                        : 'Record bedtime, wake time and quality.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isPersian ? 'تاریخ خواب' : 'Sleep date'}
                  </label>
                  <JalaliDatePicker
                    value={form.sleepDate}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        sleepDate: value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {isPersian ? 'زمان خوابیدن' : 'Bedtime'}
                    </label>
                    <input
                      type="time"
                      value={form.bedtime}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bedtime: event.target.value,
                        }))
                      }
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {isPersian ? 'زمان بیدار شدن' : 'Wake time'}
                    </label>
                    <input
                      type="time"
                      value={form.wakeTime}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          wakeTime: event.target.value,
                        }))
                      }
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Clock3
                        size={19}
                        className="text-blue-600 dark:text-blue-400"
                      />
                      <div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {isPersian
                            ? 'مدت خواب محاسبه‌شده'
                            : 'Calculated duration'}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {formatDuration(
                            durationPreview,
                            isPersian,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {form.bedtime} → {form.wakeTime}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isPersian ? 'الگوهای سریع' : 'Quick presets'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['22:00', '06:00'],
                      ['23:00', '07:00'],
                      ['23:30', '07:30'],
                      ['00:00', '08:00'],
                    ].map(([bedtime, wakeTime]) => (
                      <button
                        key={`${bedtime}-${wakeTime}`}
                        type="button"
                        onClick={() =>
                          setTimePreset(bedtime, wakeTime)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                      >
                        {bedtime} → {wakeTime}
                      </button>
                    ))}
                  </div>
                </div>

                <SleepQuality
                  value={form.quality}
                  onChange={(quality) =>
                    setForm((current) => ({
                      ...current,
                      quality,
                    }))
                  }
                  isPersian={isPersian}
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isPersian ? 'یادداشت' : 'Note'}
                  </label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder={
                      isPersian
                        ? 'مثلاً: دیر خوابیدم، چند بار بیدار شدم...'
                        : 'For example: woke up several times...'
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-11 flex-1 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Check size={17} />
                    )}
                    {editingId !== null
                      ? isPersian
                        ? 'ذخیره تغییرات'
                        : 'Save changes'
                      : isPersian
                        ? 'ثبت خواب'
                        : 'Save sleep'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
