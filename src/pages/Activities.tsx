import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Activity,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from 'lucide-react'

import {
  useLanguage,
} from '../i18n/LanguageContext'
import {
  toJalaali,
} from 'jalaali-js'

import JalaliDatePicker from '../components/JalaliDatePicker'

interface ActivityForm {
  title: string
  description: string
  category: string
  activityDate: string
  startTime: string
  endTime: string
  duration: number
  completed: boolean
}

function getTodayJalali(): string {
  const now = new Date()
  const jalali = toJalaali(now)

  return [
    jalali.jy,
    String(jalali.jm).padStart(2, '0'),
    String(jalali.jd).padStart(2, '0'),
  ].join('-')
}

function getTomorrowJalali(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const jalali = toJalaali(tomorrow)

  return [
    jalali.jy,
    String(jalali.jm).padStart(2, '0'),
    String(jalali.jd).padStart(2, '0'),
  ].join('-')
}

function getRoundedCurrentTime(): string {
  const now = new Date()
  const minutes = now.getMinutes()
  const roundedMinutes = Math.ceil(minutes / 15) * 15

  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0)
  } else {
    now.setMinutes(roundedMinutes, 0, 0)
  }

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return ''
  }

  const total = hours * 60 + minutes + minutesToAdd
  const normalized = ((total % 1440) + 1440) % 1440

  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

function createEmptyForm(): ActivityForm {
  return {
    title: '',
    description: '',
    category: 'general',
    activityDate: getTodayJalali(),
    startTime: '',
    endTime: '',
    duration: 0,
    completed: false,
  }
}

function calculateDuration(
  startTime: string,
  endTime: string,
): number {
  if (!startTime || !endTime) {
    return 0
  }

  const [startHour, startMinute] =
    startTime.split(':').map(Number)

  const [endHour, endMinute] =
    endTime.split(':').map(Number)

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0
  }

  const start =
    startHour * 60 + startMinute

  const end =
    endHour * 60 + endMinute

  if (end <= start) {
    return 0
  }

  return end - start
}

function formatDuration(
  minutes: number,
  isPersian: boolean,
): string {
  const safeMinutes = Math.max(
    0,
    Number(minutes) || 0,
  )

  const hours = Math.floor(
    safeMinutes / 60,
  )

  const remainingMinutes =
    safeMinutes % 60

  if (hours === 0) {
    return isPersian
      ? `${remainingMinutes} دقیقه`
      : `${remainingMinutes} min`
  }

  if (remainingMinutes === 0) {
    return isPersian
      ? `${hours} ساعت`
      : `${hours}h`
  }

  return isPersian
    ? `${hours} ساعت و ${remainingMinutes} دقیقه`
    : `${hours}h ${remainingMinutes}m`
}

export default function Activities() {
  const {
    language,
  } = useLanguage()

  const isPersian =
    language === 'fa'

  const [activities, setActivities] =
    useState<RailyActivity[]>([])

  const [form, setForm] =
    useState<ActivityForm>(createEmptyForm())

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState<
      'all' | 'pending' | 'completed'
    >('all')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [showForm, setShowForm] =
    useState(false)

  const loadActivities =
    async () => {
      try {
        setLoading(true)
        setError('')

        const result =
          await window.raily.activities.get()

        setActivities(result)
      } catch (err) {
        console.error(err)

        setError(
          isPersian
            ? 'خطا در دریافت فعالیت‌ها'
            : 'Failed to load activities',
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    void loadActivities()
  }, [])

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const setQuickTime = (startTime: string, duration: number) => {
    const endTime = addMinutesToTime(startTime, duration)

    setForm((current) => ({
      ...current,
      startTime,
      endTime,
      duration,
    }))
  }

  const setCurrentTime = () => {
    const startTime = getRoundedCurrentTime()
    setQuickTime(startTime, 60)
  }

  const setQuickDate = (date: string) => {
    updateForm('activityDate', date)
  }

  const handleStartTimeChange = (startTime: string) => {
    setForm((current) => {
      const calculatedDuration = calculateDuration(
        startTime,
        current.endTime,
      )

      return {
        ...current,
        startTime,
        duration:
          calculatedDuration > 0
            ? calculatedDuration
            : current.duration,
      }
    })
  }

  const handleEndTimeChange = (endTime: string) => {
    setForm((current) => {
      const calculatedDuration = calculateDuration(
        current.startTime,
        endTime,
      )

      return {
        ...current,
        endTime,
        duration:
          calculatedDuration > 0
            ? calculatedDuration
            : current.duration,
      }
    })
  }

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError(
        isPersian
          ? 'عنوان فعالیت الزامی است.'
          : 'Activity title is required.',
      )

      return
    }

    if (!form.activityDate) {
      setError(
        isPersian
          ? 'تاریخ فعالیت را انتخاب کنید.'
          : 'Please select an activity date.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const calculatedDuration =
        calculateDuration(
          form.startTime,
          form.endTime,
        )

      const duration =
        form.duration > 0
          ? form.duration
          : calculatedDuration

      const payload: CreateActivityInput = {
        title: form.title.trim(),

        description:
          form.description.trim() ||
          null,

        category:
          form.category.trim() ||
          'general',

        activityDate:
          form.activityDate,

        startTime:
          form.startTime || null,

        endTime:
          form.endTime || null,

        duration,

        completed:
          form.completed,
      }

      if (editingId !== null) {
        await window.raily.activities.update(
          editingId,
          payload,
        )
      } else {
        await window.raily.activities.create(
          payload,
        )
      }

      await loadActivities()

      resetForm()
    } catch (err) {
      console.error(err)

      setError(
        isPersian
          ? 'ذخیره فعالیت انجام نشد.'
          : 'Failed to save activity.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (
    activity: RailyActivity,
  ) => {
    setEditingId(activity.id)

    setForm({
      title: activity.title,

      description:
        activity.description ?? '',

      category:
        activity.category,

      activityDate:
        activity.activityDate,

      startTime:
        activity.startTime ?? '',

      endTime:
        activity.endTime ?? '',

      duration:
        activity.duration,

      completed:
        activity.completed,
    })

    setShowForm(true)
    setError('')
  }

  const handleDelete =
    async (id: number) => {
      const confirmed =
        window.confirm(
          isPersian
            ? 'آیا از حذف این فعالیت مطمئن هستید؟'
            : 'Are you sure you want to delete this activity?',
        )

      if (!confirmed) {
        return
      }

      try {
        await window.raily.activities.delete(
          id,
        )

        await loadActivities()

        if (editingId === id) {
          resetForm()
        }
      } catch (err) {
        console.error(err)

        setError(
          isPersian
            ? 'حذف فعالیت انجام نشد.'
            : 'Failed to delete activity.',
        )
      }
    }

  const handleToggleComplete =
    async (
      activity: RailyActivity,
    ) => {
      try {
        await window.raily.activities.update(
          activity.id,
          {
            completed:
              !activity.completed,
          },
        )

        await loadActivities()
      } catch (err) {
        console.error(err)

        setError(
          isPersian
            ? 'تغییر وضعیت فعالیت انجام نشد.'
            : 'Failed to update activity.',
        )
      }
    }

  const updateForm = <
    K extends keyof ActivityForm,
  >(
    key: K,
    value: ActivityForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const filteredActivities =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return activities.filter(
        (activity) => {
          const matchesSearch =
            !query ||
            activity.title
              .toLowerCase()
              .includes(query) ||
            (
              activity.description ??
              ''
            )
              .toLowerCase()
              .includes(query) ||
            activity.category
              .toLowerCase()
              .includes(query)

          const matchesFilter =
            filter === 'all' ||
            (
              filter === 'completed' &&
              activity.completed
            ) ||
            (
              filter === 'pending' &&
              !activity.completed
            )

          return (
            matchesSearch &&
            matchesFilter
          )
        },
      )
    }, [
      activities,
      search,
      filter,
    ])

  const totalActivities =
    activities.length

  const completedActivities =
    activities.filter(
      (activity) =>
        activity.completed,
    ).length

  const totalMinutes =
    activities.reduce(
      (total, activity) =>
        total +
        (Number(activity.duration) || 0),
      0,
    )

  return (
    <div
      className={`min-h-full p-6 ${
        isPersian ? 'rtl' : 'ltr'
      }`}
      dir={
        isPersian
          ? 'rtl'
          : 'ltr'
      }
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Activity size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isPersian
                    ? 'فعالیت‌ها'
                    : 'Activities'}
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'فعالیت‌های روزانه و زمان صرف‌شده را مدیریت کنید.'
                    : 'Manage your daily activities and time spent.'}
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(createEmptyForm())
              setError('')
              setShowForm(true)
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />

            {isPersian
              ? 'فعالیت جدید'
              : 'New Activity'}
          </button>
        </div>

        {/* Statistics */}

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'کل فعالیت‌ها'
                    : 'Total Activities'}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {totalActivities}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <Activity size={21} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'تکمیل‌شده'
                    : 'Completed'}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {completedActivities}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <Check size={21} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isPersian
                    ? 'زمان کل'
                    : 'Total Time'}
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {formatDuration(
                    totalMinutes,
                    isPersian,
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40">
                <Timer size={21} />
              </div>

            </div>
          </div>

        </div>

        {/* Search / Filters */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={18}
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  isPersian
                    ? 'right-3'
                    : 'left-3'
                }`}
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder={
                  isPersian
                    ? 'جستجوی فعالیت...'
                    : 'Search activities...'
                }
                className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
                  isPersian
                    ? 'pr-10 pl-4'
                    : 'pl-10 pr-4'
                }`}
              />

            </div>

            <div className="flex gap-2 overflow-x-auto">

              {(
                [
                  'all',
                  'pending',
                  'completed',
                ] as const
              ).map((item) => (

                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`min-h-11 whitespace-nowrap rounded-xl px-4 text-sm font-medium transition ${
                    filter === item
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {item === 'all'
                    ? isPersian
                      ? 'همه'
                      : 'All'
                    : item === 'pending'
                      ? isPersian
                        ? 'در انتظار'
                        : 'Pending'
                      : isPersian
                        ? 'تکمیل‌شده'
                        : 'Completed'}
                </button>

              ))}

            </div>

          </div>

        </div>

        {/* Error */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* Form */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId !== null
                  ? isPersian
                    ? 'ویرایش فعالیت'
                    : 'Edit Activity'
                  : isPersian
                    ? 'فعالیت جدید'
                    : 'New Activity'}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={19} />
              </button>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isPersian
                    ? 'عنوان'
                    : 'Title'}
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      'title',
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder={
                    isPersian
                      ? 'مثلاً مطالعه جاوااسکریپت'
                      : 'e.g. JavaScript study'
                  }
                />

              </div>

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isPersian
                    ? 'توضیحات'
                    : 'Description'}
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      'description',
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isPersian
                    ? 'دسته‌بندی'
                    : 'Category'}
                </label>

                <input
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      'category',
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                      <CalendarCheck2 size={17} className="text-blue-600 dark:text-blue-400" />
                      {isPersian ? 'زمان‌بندی فعالیت' : 'Activity schedule'}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {isPersian
                        ? 'تاریخ و زمان را سریع انتخاب کنید؛ مدت زمان به‌صورت خودکار محاسبه می‌شود.'
                        : 'Choose the date and time quickly. Duration is calculated automatically.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickDate(getTodayJalali())}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  >
                    <CalendarDays size={16} />
                    {isPersian ? 'امروز' : 'Today'}
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isPersian ? 'تاریخ فعالیت' : 'Activity date'}
                    </label>

                    <JalaliDatePicker
                      value={form.activityDate}
                      onChange={(value) => updateForm('activityDate', value)}
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickDate(getTodayJalali())}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {isPersian ? 'امروز' : 'Today'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(getTomorrowJalali())}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {isPersian ? 'فردا' : 'Tomorrow'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isPersian ? 'زمان فعالیت' : 'Activity time'}
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">
                          {isPersian ? 'شروع' : 'Start'}
                        </span>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(event) => handleStartTimeChange(event.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <span className="mb-1.5 block text-xs text-slate-500 dark:text-slate-400">
                          {isPersian ? 'پایان' : 'End'}
                        </span>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(event) => handleEndTimeChange(event.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={setCurrentTime}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                      >
                        {isPersian ? 'الان + ۱ ساعت' : 'Now + 1 hour'}
                      </button>
                      {[
                        ['08:00', '10:00'],
                        ['10:00', '12:00'],
                        ['14:00', '16:00'],
                        ['18:00', '20:00'],
                      ].map(([start, end]) => (
                        <button
                          key={`${start}-${end}`}
                          type="button"
                          onClick={() => setQuickTime(start, 120)}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {start}–{end}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isPersian ? 'مدت محاسبه‌شده' : 'Calculated duration'}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">
                        {formatDuration(form.duration, isPersian)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isPersian
                    ? 'مدت زمان دستی (دقیقه)'
                    : 'Manual duration (minutes)'}
                </label>

                <input
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(event) =>
                    updateForm(
                      'duration',
                      Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  {isPersian
                    ? 'اگر زمان شروع و پایان وارد شود، مقدار مناسب به‌صورت خودکار ثبت می‌شود.'
                    : 'When start and end times are set, the duration is calculated automatically.'}
                </p>
              </div>

              <div className="flex items-end">

                <label className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800">

                  <input
                    type="checkbox"
                    checked={
                      form.completed
                    }
                    onChange={(event) =>
                      updateForm(
                        'completed',
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 accent-blue-600"
                  />

                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isPersian
                      ? 'فعالیت تکمیل شده'
                      : 'Activity completed'}
                  </span>

                </label>

              </div>

            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">

              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isPersian
                  ? 'انصراف'
                  : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? isPersian
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : editingId !== null
                    ? isPersian
                      ? 'ذخیره تغییرات'
                      : 'Save Changes'
                    : isPersian
                      ? 'ایجاد فعالیت'
                      : 'Create Activity'}
              </button>

            </div>

          </form>
        )}

        {/* Activities */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'در حال بارگذاری...'
                : 'Loading...'}
            </div>

          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Activity size={26} />
            </div>

            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isPersian
                ? 'فعالیتی پیدا نشد'
                : 'No activities found'}
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'برای شروع یک فعالیت جدید ایجاد کنید.'
                : 'Create a new activity to get started.'}
            </p>

          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {filteredActivities.map(
              (activity) => (
                <article
                  key={activity.id}
                  className={`rounded-2xl border bg-white p-5 transition dark:bg-slate-900 ${
                    activity.completed
                      ? 'border-emerald-200 dark:border-emerald-900/50'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleComplete(
                              activity,
                            )
                          }
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                            activity.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 text-transparent hover:border-blue-500 dark:border-slate-600'
                          }`}
                          aria-label={
                            isPersian
                              ? 'تغییر وضعیت'
                              : 'Toggle completion'
                          }
                        >
                          <Check size={16} />
                        </button>

                        <h3
                          className={`truncate text-base font-bold ${
                            activity.completed
                              ? 'text-slate-400 line-through'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {activity.title}
                        </h3>

                      </div>

                      {activity.category && (
                        <span className="mt-3 inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          {activity.category}
                        </span>
                      )}

                    </div>

                    <div className="flex shrink-0 items-center gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            activity,
                          )
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                        aria-label={
                          isPersian
                            ? 'ویرایش'
                            : 'Edit'
                        }
                      >
                        <Edit3 size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            activity.id,
                          )
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        aria-label={
                          isPersian
                            ? 'حذف'
                            : 'Delete'
                        }
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </div>

                  {activity.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </p>
                  )}

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">

                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">

                      <CalendarDays
                        size={16}
                        className="shrink-0"
                      />

                      <span>
                        {activity.activityDate}
                      </span>

                    </div>

                    {(activity.startTime ||
                      activity.endTime) && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">

                        <Clock3
                          size={16}
                          className="shrink-0"
                        />

                        <span dir="ltr">
                          {activity.startTime ??
                            '--:--'}

                          {' → '}

                          {activity.endTime ??
                            '--:--'}
                        </span>

                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">

                      <Timer
                        size={16}
                        className="shrink-0"
                      />

                      <span>
                        {formatDuration(
                          activity.duration,
                          isPersian,
                        )}
                      </span>

                    </div>

                  </div>

                </article>
              ),
            )}

          </div>
        )}

      </div>
    </div>
  )
}