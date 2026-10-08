import React, { useEffect, useMemo, useState } from 'react'
import JalaliDatePicker from '../components/JalaliDatePicker'
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  toJalaali,
  isValidJalaaliDate,
  toGregorian,
  jalaaliMonthLength,
} from 'jalaali-js'

type Lang = 'fa' | 'en'
type Theme = 'light' | 'dark'

type EventForm = {
  title: string
  description: string
  eventDate: string
  startTime: string
  endTime: string
  allDay: boolean
  location: string
  category: string
  reminderMinutes: string
  color: string
}

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#ea580c', '#db2777', '#0891b2', '#ca8a04']
const CATEGORIES = [
  { value: 'general', fa: 'عمومی', en: 'General' },
  { value: 'work', fa: 'کار', en: 'Work' },
  { value: 'study', fa: 'درس', en: 'Study' },
  { value: 'meeting', fa: 'جلسه', en: 'Meeting' },
  { value: 'personal', fa: 'شخصی', en: 'Personal' },
  { value: 'health', fa: 'سلامت', en: 'Health' },
  { value: 'travel', fa: 'سفر', en: 'Travel' },
]

const emptyForm: EventForm = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  location: '',
  category: 'general',
  reminderMinutes: '15',
  color: COLORS[0],
}

function todayJalaali() {
  const now = new Date()
  const j = toJalaali(now)
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`
}

function parseJalaali(value: string) {
  const parts = value.split('/').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const [jy, jm, jd] = parts
  if (!isValidJalaaliDate(jy, jm, jd)) return null
  return { jy, jm, jd }
}

function formatDate(value: string, lang: Lang) {
  const parsed = parseJalaali(value)
  if (!parsed) return value
  const g = toGregorian(parsed.jy, parsed.jm, parsed.jd)
  const date = new Date(g.gy, g.gm - 1, g.gd)
  return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function dateKey(jy: number, jm: number, jd: number) {
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}

function categoryLabel(category: string, lang: Lang) {
  const found = CATEGORIES.find((item) => item.value === category)
  return found ? found[lang] : category
}

function getMonthDays(year: number, month: number) {
  const total = jalaaliMonthLength(year, month)
  const days: Array<{ jy: number; jm: number; jd: number; key: string }> = []
  for (let d = 1; d <= total; d += 1) {
    days.push({ jy: year, jm: month, jd: d, key: dateKey(year, month, d) })
  }
  return days
}

function getJalaaliWeekday(year: number, month: number, day: number) {
  const g = toGregorian(year, month, day)
  const date = new Date(g.gy, g.gm - 1, g.gd)
  return date.getDay()
}

function getCalendarCells(year: number, month: number) {
  const days = getMonthDays(year, month)
  const first = getJalaaliWeekday(year, month, 1)
  const offset = (first + 1) % 7
  const prev = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevTotal = jalaaliMonthLength(prevYear, prev)

  const cells: Array<{ jy: number; jm: number; jd: number; key: string; outside: boolean }> = []

  for (let i = offset - 1; i >= 0; i -= 1) {
    const d = prevTotal - i
    cells.push({ jy: prevYear, jm: prev, jd: d, key: dateKey(prevYear, prev, d), outside: true })
  }

  days.forEach((day) => cells.push({ ...day, outside: false }))

  let nextDay = 1
  while (cells.length < 42) {
    const next = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    cells.push({
      jy: nextYear,
      jm: next,
      jd: nextDay,
      key: dateKey(nextYear, next, nextDay),
      outside: true,
    })
    nextDay += 1
  }

  return cells
}

export default function Events() {
  const [events, setEvents] = useState<RailyEvent[]>([])
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayJalaali())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [lang, setLang] = useState<Lang>('fa')
  const [theme, setTheme] = useState<Theme>('light')

  const today = todayJalaali()
  const selected = parseJalaali(selectedDate) ?? parseJalaali(today)!
  const [calendarYear, setCalendarYear] = useState(selected.jy)
  const [calendarMonth, setCalendarMonth] = useState(selected.jm)

  const isFa = lang === 'fa'
  const dir = isFa ? 'rtl' : 'ltr'

  const t = {
    title: isFa ? 'رویدادها' : 'Events',
    subtitle: isFa ? 'قرارها و اتفاق‌های مهمت رو یکجا مدیریت کن' : 'Manage your important plans and moments in one place',
    add: isFa ? 'رویداد جدید' : 'New event',
    search: isFa ? 'جستجوی رویداد...' : 'Search events...',
    all: isFa ? 'همه' : 'All',
    upcoming: isFa ? 'پیش رو' : 'Upcoming',
    today: isFa ? 'امروز' : 'Today',
    empty: isFa ? 'هنوز رویدادی ثبت نشده' : 'No events yet',
    emptyHint: isFa ? 'اولین رویدادت رو بساز تا اینجا نمایش داده بشه' : 'Create your first event to see it here',
    edit: isFa ? 'ویرایش' : 'Edit',
    delete: isFa ? 'حذف' : 'Delete',
    save: isFa ? 'ذخیره رویداد' : 'Save event',
    update: isFa ? 'ذخیره تغییرات' : 'Save changes',
    cancel: isFa ? 'انصراف' : 'Cancel',
    newTitle: isFa ? 'ساخت رویداد جدید' : 'Create new event',
    editTitle: isFa ? 'ویرایش رویداد' : 'Edit event',
    titleLabel: isFa ? 'عنوان' : 'Title',
    description: isFa ? 'توضیحات' : 'Description',
    date: isFa ? 'تاریخ' : 'Date',
    start: isFa ? 'شروع' : 'Start',
    end: isFa ? 'پایان' : 'End',
    allDay: isFa ? 'تمام روز' : 'All day',
    location: isFa ? 'مکان' : 'Location',
    category: isFa ? 'دسته‌بندی' : 'Category',
    reminder: isFa ? 'یادآوری' : 'Reminder',
    noReminder: isFa ? 'بدون یادآوری' : 'No reminder',
    minutes: isFa ? 'دقیقه قبل' : 'minutes before',
    color: isFa ? 'رنگ' : 'Color',
    selectDate: isFa ? 'انتخاب تاریخ' : 'Select date',
    monthNames: isFa
      ? ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
      : ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
    weekdays: isFa ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] : ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
  }

  useEffect(() => {
    void loadEvents()
    void loadSettings()
  }, [])

  useEffect(() => {
    setCalendarYear(selected.jy)
    setCalendarMonth(selected.jm)
  }, [selectedDate])

  useEffect(() => {
    if (!notice && !error) return
    const timer = window.setTimeout(() => {
      setNotice('')
      setError('')
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [notice, error])

  async function loadSettings() {
    try {
      const settings = await window.raily.settings.get()
      if (settings) {
        setLang(settings.language)
        setTheme(settings.theme === 'dark' ? 'dark' : 'light')
      }
    } catch {
      // UI remains usable with defaults.
    }
  }

  async function loadEvents() {
    try {
      setLoading(true)
      const data = await window.raily.events.get()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : isFa ? 'خطا در دریافت رویدادها' : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  function openCreate(date = selectedDate) {
    setEditingId(null)
    setForm({ ...emptyForm, eventDate: date })
    setModalOpen(true)
    setError('')
  }

  function openEdit(event: RailyEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description ?? '',
      eventDate: event.eventDate,
      startTime: event.startTime ?? '09:00',
      endTime: event.endTime ?? '10:00',
      allDay: event.allDay,
      location: event.location ?? '',
      category: event.category,
      reminderMinutes: event.reminderMinutes == null ? '' : String(event.reminderMinutes),
      color: event.color ?? COLORS[0],
    })
    setModalOpen(true)
    setError('')
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = parseJalaali(form.eventDate)
    if (!form.title.trim()) {
      setError(isFa ? 'عنوان رو وارد کن' : 'Enter a title')
      return
    }
    if (!parsed) {
      setError(isFa ? 'تاریخ واردشده معتبر نیست' : 'The date is invalid')
      return
    }
    if (!form.allDay && form.endTime && form.startTime && form.endTime < form.startTime) {
      setError(isFa ? 'ساعت پایان نمی‌تونه قبل از شروع باشه' : 'End time cannot be before start time')
      return
    }

    const reminder = form.reminderMinutes === '' ? null : Number(form.reminderMinutes)
    if (reminder !== null && (!Number.isInteger(reminder) || reminder < 0)) {
      setError(isFa ? 'زمان یادآوری معتبر نیست' : 'Reminder value is invalid')
      return
    }

    setSaving(true)
    try {
      const payload: CreateEventInput = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        eventDate: form.eventDate,
        startTime: form.allDay ? null : form.startTime || null,
        endTime: form.allDay ? null : form.endTime || null,
        allDay: form.allDay,
        location: form.location.trim() || null,
        category: form.category,
        reminderMinutes: reminder,
        color: form.color,
      }

      if (editingId === null) {
        const created = await window.raily.events.create(payload)
        setEvents((prev) => [created, ...prev])
        setNotice(isFa ? 'رویداد با موفقیت ساخته شد ✨' : 'Event created successfully ✨')
      } else {
        const updated = await window.raily.events.update(editingId, payload)
        setEvents((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
        setNotice(isFa ? 'رویداد به‌روزرسانی شد ✨' : 'Event updated ✨')
      }

      setModalOpen(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : isFa ? 'ذخیره رویداد ناموفق بود' : 'Could not save event')
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(id: number) {
    const confirmed = window.confirm(isFa ? 'این رویداد حذف بشه؟' : 'Delete this event?')
    if (!confirmed) return

    setDeletingId(id)
    try {
      await window.raily.events.delete(id)
      setEvents((prev) => prev.filter((item) => item.id !== id))
      setNotice(isFa ? 'رویداد حذف شد' : 'Event deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : isFa ? 'حذف ناموفق بود' : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events
      .filter((event) => filter === 'all' || event.category === filter)
      .filter((event) => {
        if (!query) return true
        return [event.title, event.description ?? '', event.location ?? '', event.category]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        const dateCompare = a.eventDate.localeCompare(b.eventDate)
        if (dateCompare !== 0) return dateCompare
        return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')
      })
  }, [events, filter, search])

  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((event) => event.eventDate === selectedDate),
    [filteredEvents, selectedDate],
  )

  const upcomingCount = events.filter((event) => event.eventDate >= today).length
  const todayCount = events.filter((event) => event.eventDate === today).length
  const monthCells = getCalendarCells(calendarYear, calendarMonth)

  const eventCountForDay = (key: string) => events.filter((event) => event.eventDate === key).length

  function moveMonth(delta: number) {
    let year = calendarYear
    let month = calendarMonth + delta
    if (month < 1) {
      month = 12
      year -= 1
    } else if (month > 12) {
      month = 1
      year += 1
    }
    setCalendarYear(year)
    setCalendarMonth(month)
  }

  function selectCalendarDay(cell: (typeof monthCells)[number]) {
    setSelectedDate(cell.key)
    if (cell.outside) {
      setCalendarYear(cell.jy)
      setCalendarMonth(cell.jm)
    }
  }

  const surface = theme === 'dark'
    ? 'bg-slate-950 text-slate-100'
    : 'bg-[#f7f7fb] text-slate-900'

  return (
    <div dir={dir} className={`min-h-full overflow-hidden ${surface}`}>
      <style>{`
        @keyframes eventFadeUp {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes eventFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes eventPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,.12); }
          50% { box-shadow: 0 0 0 9px rgba(124,58,237,0); }
        }
        @keyframes eventShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes eventModalIn {
          from { opacity: 0; transform: translateY(18px) scale(.975); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes eventBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes eventPickerFocus {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,.18); }
          100% { box-shadow: 0 0 0 7px rgba(99,102,241,0); }
        }
        .event-fade { animation: eventFadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .event-float { animation: eventFloat 3.2s ease-in-out infinite; }
        .event-pulse { animation: eventPulse 2.3s ease-in-out infinite; }
        .event-modal { animation: eventModalIn .32s cubic-bezier(.22,1,.36,1) both; }
        .event-backdrop { animation: eventBackdropIn .22s ease both; }
        .event-date-field:focus-within { animation: eventPickerFocus .7s ease-out; }
        .event-date-field > * { width: 100%; }
        @media (max-width: 640px) {
          .event-date-field { min-height: 48px; }
        }
        .event-delay-1 { animation-delay: .05s; }
        .event-delay-2 { animation-delay: .1s; }
        .event-delay-3 { animation-delay: .15s; }
        .event-delay-4 { animation-delay: .2s; }
        .event-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .event-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.25); border-radius: 999px; }
        @media (prefers-reduced-motion: reduce) {
          .event-fade, .event-float, .event-pulse, .event-modal, .event-backdrop, .event-date-field { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1450px] px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-7">
        <header className="event-fade relative mb-5 overflow-hidden rounded-[30px] border border-white/50 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-6 text-white shadow-2xl shadow-indigo-500/15 sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-white/75">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-[.2em]">
                  {isFa ? 'Raily Events' : 'Raily Events'}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{t.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => openCreate()}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold text-indigo-700 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[.98]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 transition group-hover:rotate-90">
                <Plus size={17} />
              </span>
              {t.add}
            </button>
          </div>
        </header>

        {notice && (
          <div className="event-fade mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check size={18} />
            {notice}
          </div>
        )}

        {error && (
          <div className="event-fade mb-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: CalendarDays, label: isFa ? 'کل رویدادها' : 'Total events', value: events.length, accent: 'from-violet-500 to-indigo-500' },
            { icon: Clock3, label: isFa ? 'رویدادهای پیش رو' : 'Upcoming', value: upcomingCount, accent: 'from-sky-500 to-cyan-500' },
            { icon: Bell, label: isFa ? 'رویدادهای امروز' : 'Today', value: todayCount, accent: 'from-emerald-500 to-teal-500' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`event-fade event-delay-${index + 1} group rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black">{stat.value}</p>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg transition duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  <stat.icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-11 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`h-12 whitespace-nowrap rounded-2xl px-4 text-sm font-bold transition ${filter === 'all' ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              {t.all}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilter(cat.value)}
                className={`h-12 whitespace-nowrap rounded-2xl px-4 text-sm font-bold transition ${filter === cat.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}
              >
                {cat[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="event-fade rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-500">{isFa ? 'تقویم' : 'Calendar'}</p>
                <h2 className="mt-1 text-lg font-black">
                  {t.monthNames[calendarMonth - 1]} {calendarYear}
                </h2>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveMonth(-1)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronRight size={18} className={isFa ? '' : 'rotate-180'} />
                </button>
                <button type="button" onClick={() => moveMonth(1)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronLeft size={18} className={isFa ? '' : 'rotate-180'} />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
              {t.weekdays.map((day) => <div key={day} className="py-2">{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell) => {
                const count = eventCountForDay(cell.key)
                const selectedCell = cell.key === selectedDate
                const todayCell = cell.key === today

                return (
                  <button
                    type="button"
                    key={cell.key}
                    onClick={() => selectCalendarDay(cell)}
                    className={`relative aspect-square rounded-2xl text-sm font-bold transition duration-200 hover:scale-105 ${
                      selectedCell
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : cell.outside
                          ? 'text-slate-300 dark:text-slate-700'
                          : 'text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cell.jd}
                    {todayCell && !selectedCell && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />}
                    {count > 0 && (
                      <span className={`absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] ${selectedCell ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div>
                <p className="text-xs text-slate-500">{isFa ? 'انتخاب‌شده' : 'Selected'}</p>
                <p className="mt-1 text-sm font-black">{formatDate(selectedDate, lang)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(today)
                  setCalendarYear(selected.jy)
                  setCalendarMonth(selected.jm)
                }}
                className="rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950"
              >
                {t.today}
              </button>
            </div>
          </section>

          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-indigo-500">{formatDate(selectedDate, lang)}</p>
                <h2 className="mt-1 text-2xl font-black">
                  {selectedDayEvents.length} {isFa ? 'رویداد برای این روز' : 'events for this day'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openCreate(selectedDate)}
                className="event-pulse inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
              >
                <Plus size={17} />
                {t.add}
              </button>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
                ))}
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="event-fade flex min-h-[360px] flex-col items-center justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/60 px-6 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <div className="event-float mb-5 grid h-20 w-20 place-items-center rounded-[28px] bg-indigo-100 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                  <CalendarDays size={34} />
                </div>
                <h3 className="text-lg font-black">{t.empty}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{t.emptyHint}</p>
                <button
                  type="button"
                  onClick={() => openCreate(selectedDate)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-1 dark:bg-white dark:text-slate-900"
                >
                  <Plus size={17} />
                  {t.add}
                </button>
              </div>
            ) : (
              <div className="event-scroll grid max-h-[720px] gap-4 overflow-y-auto pe-1">
                {selectedDayEvents.map((event, index) => (
                  <article
                    key={event.id}
                    className={`event-fade event-delay-${Math.min(index + 1, 4)} group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900`}
                  >
                    <div className="absolute inset-y-0 w-1.5" style={{ backgroundColor: event.color ?? COLORS[0], [isFa ? 'right' : 'left']: 0 }} />
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
                          style={{ backgroundColor: event.color ?? COLORS[0] }}
                        >
                          {event.allDay ? <CalendarDays size={21} /> : <Clock3 size={21} />}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">{event.title}</h3>
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-black"
                              style={{
                                backgroundColor: `${event.color ?? COLORS[0]}18`,
                                color: event.color ?? COLORS[0],
                              }}
                            >
                              {categoryLabel(event.category, lang)}
                            </span>
                          </div>
                          {event.description && (
                            <p className="mb-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={14} />
                              {event.allDay ? (isFa ? 'تمام روز' : 'All day') : `${event.startTime ?? '--:--'}${event.endTime ? ` — ${event.endTime}` : ''}`}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin size={14} />
                                {event.location}
                              </span>
                            )}
                            {event.reminderMinutes != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Bell size={14} />
                                {event.reminderMinutes} {t.minutes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 opacity-100 transition sm:opacity-70 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:hover:bg-indigo-950"
                          title={t.edit}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === event.id}
                          onClick={() => void removeEvent(event.id)}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-rose-950"
                          title={t.delete}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {modalOpen && (
        <div
          className="event-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="event-modal max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <p className="text-xs font-bold text-indigo-500">{isFa ? 'مدیریت رویداد' : 'Event management'}</p>
                <h2 className="mt-1 text-xl font-black">{editingId === null ? t.newTitle : t.editTitle}</h2>
              </div>
              <button type="button" onClick={closeModal} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submit} className="event-scroll max-h-[calc(92vh-82px)] overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.titleLabel}</span>
                  <input
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={isFa ? 'مثلاً جلسه تیم پروژه' : 'e.g. Project team meeting'}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.description}</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder={isFa ? 'توضیحات اختیاری...' : 'Optional description...'}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.date}</label>
                    <div className="event-date-field min-w-0 transition duration-300 hover:-translate-y-0.5">
                      <JalaliDatePicker
                        value={form.eventDate.replaceAll('/', '-')}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            eventDate: value.replaceAll('-', '/'),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <label className="flex h-12 items-center justify-between self-end rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-sm font-bold">{t.allDay}</span>
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm((prev) => ({ ...prev, allDay: e.target.checked }))}
                      className="h-5 w-5 accent-indigo-600"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.start}</span>
                    <input
                      type="time"
                      disabled={form.allDay}
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.end}</span>
                    <input
                      type="time"
                      disabled={form.allDay}
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.location}</span>
                    <div className="relative">
                      <MapPin className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" size={17} />
                      <input
                        value={form.location}
                        onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder={isFa ? 'مثلاً دانشگاه' : 'e.g. University'}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.category}</span>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pe-10 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800"
                      >
                        {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat[lang]}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:right-4 rtl:left-4" size={17} />
                    </div>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.reminder}</span>
                    <div className="relative">
                      <Bell className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" size={17} />
                      <select
                        value={form.reminderMinutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, reminderMinutes: e.target.value }))}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 pe-10 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="">{t.noReminder}</option>
                        <option value="5">5 {t.minutes}</option>
                        <option value="10">10 {t.minutes}</option>
                        <option value="15">15 {t.minutes}</option>
                        <option value="30">30 {t.minutes}</option>
                        <option value="60">60 {t.minutes}</option>
                        <option value="1440">1 {isFa ? 'روز قبل' : 'day before'}</option>
                      </select>
                    </div>
                  </label>

                  <div>
                    <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">{t.color}</span>
                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, color }))}
                          className={`grid h-7 w-7 place-items-center rounded-full transition hover:scale-110 ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        >
                          {form.color === color && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 rounded-2xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? (isFa ? 'در حال ذخیره...' : 'Saving...') : editingId === null ? t.save : t.update}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
