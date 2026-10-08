import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  History,
  Loader2,
  MessageCircle,
  Moon,
  Plus,
  Save,
  ShieldCheck,
  Smile,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react'

type Lang = 'fa' | 'en'

type FormState = {
  checkInDate: string
  mood: number
  cried: boolean | null
  sadness: number
  anger: number
  anxiety: number
  energy: number
  sleepQuality: number
  happiness: number
  selfCare: number
  feelingSafe: boolean | null
  bothering: string
  note: string
}

const emptyForm = (date: string): FormState => ({
  checkInDate: date,
  mood: 3,
  cried: null,
  sadness: 1,
  anger: 1,
  anxiety: 1,
  energy: 3,
  sleepQuality: 3,
  happiness: 3,
  selfCare: 3,
  feelingSafe: null,
  bothering: '',
  note: '',
})

const moodEmoji = ['😞', '😕', '😐', '🙂', '😄']

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(value: string, lang: Lang) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function scaleLabel(value: number, lang: Lang) {
  if (lang === 'fa') {
    return ['خیلی کم', 'کم', 'متوسط', 'خوب', 'خیلی خوب'][value - 1]
  }
  return ['Very low', 'Low', 'Medium', 'Good', 'Very good'][value - 1]
}

function getScore(form: FormState) {
  const positive =
    form.mood +
    form.energy +
    form.sleepQuality +
    form.happiness +
    form.selfCare

  const negative =
    form.sadness +
    form.anger +
    form.anxiety

  return Math.max(0, Math.min(100, Math.round((positive / 25) * 100 - ((negative - 3) / 12) * 25)))
}

export default function Mind() {
  const [lang, setLang] = useState<Lang>('fa')
  const [dark, setDark] = useState(false)
  const [records, setRecords] = useState<RailyMindRecord[]>([])
  const [form, setForm] = useState<FormState>(() => emptyForm(todayIso()))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState('')

  const rtl = lang === 'fa'

  const t = {
    title: lang === 'fa' ? 'ذهن و حال' : 'Mind & Mood',
    subtitle:
      lang === 'fa'
        ? 'چند دقیقه برای بررسی حال امروزت وقت بذار'
        : 'Take a few minutes to check in with yourself.',
    today: lang === 'fa' ? 'امروز' : 'Today',
    save: lang === 'fa' ? 'ذخیره چک‌این' : 'Save check-in',
    update: lang === 'fa' ? 'ذخیره تغییرات' : 'Save changes',
    new: lang === 'fa' ? 'چک‌این جدید' : 'New check-in',
    history: lang === 'fa' ? 'سوابق' : 'History',
    mood: lang === 'fa' ? 'حالت چطوره؟' : 'How are you feeling?',
    cried: lang === 'fa' ? 'امروز گریه کردی؟' : 'Did you cry today?',
    sadness: lang === 'fa' ? 'غم و ناراحتی' : 'Sadness',
    anger: lang === 'fa' ? 'عصبانیت' : 'Anger',
    anxiety: lang === 'fa' ? 'اضطراب' : 'Anxiety',
    energy: lang === 'fa' ? 'انرژی' : 'Energy',
    sleep: lang === 'fa' ? 'کیفیت خواب' : 'Sleep quality',
    happiness: lang === 'fa' ? 'شادی' : 'Happiness',
    selfCare: lang === 'fa' ? 'مراقبت از خود' : 'Self-care',
    safe: lang === 'fa' ? 'الان احساس امنیت می‌کنی؟' : 'Do you feel safe right now?',
    bothering: lang === 'fa' ? 'چی بیشتر از همه ذهنت رو درگیر کرده؟' : 'What is bothering you most?',
    note: lang === 'fa' ? 'یادداشت' : 'Note',
    notePlaceholder:
      lang === 'fa' ? 'هر چیزی که دوست داری بنویس...' : 'Write anything you want...',
    botheringPlaceholder:
      lang === 'fa' ? 'مثلاً درس، رابطه، خانواده، کار...' : 'Study, relationship, family, work...',
    yes: lang === 'fa' ? 'بله' : 'Yes',
    no: lang === 'fa' ? 'نه' : 'No',
    score: lang === 'fa' ? 'امتیاز امروز' : 'Today’s score',
    suggestion: lang === 'fa' ? 'پیشنهاد امروز' : 'Today’s suggestion',
    noRecords: lang === 'fa' ? 'هنوز چک‌این ذخیره نکردی.' : 'No check-ins yet.',
    delete: lang === 'fa' ? 'حذف' : 'Delete',
    edit: lang === 'fa' ? 'ویرایش' : 'Edit',
    confirmDelete:
      lang === 'fa'
        ? 'این چک‌این حذف شود؟'
        : 'Delete this check-in?',
    safety:
      lang === 'fa'
        ? 'اگر الان احساس امنیت نمی‌کنی یا احتمال آسیب زدن به خودت وجود داره تنها نمون. با یک آدم قابل اعتماد تماس بگیر و از خدمات اورژانسی محل زندگی‌ات کمک بگیر.'
        : 'If you do not feel safe or might hurt yourself, do not stay alone. Contact someone you trust and seek local emergency help.',
    saved: lang === 'fa' ? 'ذخیره شد' : 'Saved',
    error: lang === 'fa' ? 'ذخیره اطلاعات انجام نشد.' : 'Could not save the information.',
  }

  const score = useMemo(() => getScore(form), [form])

  const suggestion = useMemo(() => {
    if (form.feelingSafe === false) return t.safety
    if (form.anxiety >= 4)
      return lang === 'fa'
        ? 'چند دقیقه از چیزی که ذهنت رو شلوغ کرده فاصله بگیر و آروم نفس بکش.'
        : 'Step away from what is overwhelming you for a few minutes and breathe slowly.'
    if (form.energy <= 2 || form.sleepQuality <= 2)
      return lang === 'fa'
        ? 'امروز فشار رو کمتر کن. استراحت و خواب کافی الان ارزش بیشتری داره.'
        : 'Lower the pressure today. Rest and enough sleep matter more right now.'
    if (form.happiness >= 4 && form.selfCare >= 4)
      return lang === 'fa'
        ? 'شرایط امروزت خوبه. سعی کن همین چیزهای کوچیک خوب رو حفظ کنی.'
        : 'You are doing well today. Keep protecting the small things that help.'
    return lang === 'fa'
      ? 'لازم نیست همیشه حالت عالی باشه. فقط صادقانه ببین امروز چه چیزی لازم داری.'
      : 'You do not need to feel great all the time. Notice what you genuinely need today.'
  }, [form, lang, t.safety])

  async function loadRecords() {
    setLoading(true)
    setError('')
    try {
      const data = await window.raily.mind.get()
      setRecords(data)
    } catch {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecords()

    window.raily.settings.get().then((settings) => {
      if (settings) {
        setLang(settings.language)
        setDark(settings.theme === 'dark')
      }
    }).catch(() => {})
  }, [])

  function setValue<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm(todayIso()))
    setSaved(false)
    setError('')
  }

  function editRecord(record: RailyMindRecord) {
    setEditingId(record.id)
    setForm({
      checkInDate: record.checkInDate,
      mood: record.mood,
      cried: record.cried,
      sadness: record.sadness ?? 1,
      anger: record.anger ?? 1,
      anxiety: record.anxiety ?? 1,
      energy: record.energy ?? 3,
      sleepQuality: record.sleepQuality ?? 3,
      happiness: record.happiness ?? 3,
      selfCare: record.selfCare ?? 3,
      feelingSafe: record.feelingSafe,
      bothering: record.bothering ?? '',
      note: record.note ?? '',
    })
    setSaved(false)
    setError('')
    setShowHistory(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveCheckIn() {
    if (saving) return

    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const payload = {
        checkInDate: form.checkInDate,
        mood: form.mood,
        cried: form.cried,
        sadness: form.sadness,
        anger: form.anger,
        anxiety: form.anxiety,
        energy: form.energy,
        sleepQuality: form.sleepQuality,
        happiness: form.happiness,
        selfCare: form.selfCare,
        feelingSafe: form.feelingSafe,
        bothering: form.bothering.trim() || null,
        note: form.note.trim() || null,
      }

      if (editingId === null) {
        await window.raily.mind.create(payload)
      } else {
        await window.raily.mind.update(editingId, payload)
      }

      await loadRecords()
      setSaved(true)

      if (editingId !== null) {
        setEditingId(null)
      }
    } catch {
      setError(t.error)
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(id: number) {
    if (deletingId !== null) return
    if (!window.confirm(t.confirmDelete)) return

    setDeletingId(id)
    setError('')

    try {
      await window.raily.mind.delete(id)
      setRecords((current) => current.filter((record) => record.id !== id))

      if (editingId === id) startNew()
    } catch {
      setError(t.error)
    } finally {
      setDeletingId(null)
    }
  }

  function Choice({
    value,
    current,
    onClick,
    label,
  }: {
    value: boolean
    current: boolean | null
    onClick: () => void
    label: string
  }) {
    const active = current === value

    return (
      <button
        type="button"
        onClick={onClick}
        className={`min-h-11 rounded-xl border px-5 text-sm font-semibold transition-all ${
          active
            ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-500/20'
            : dark
              ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
              : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'
        }`}
      >
        {label}
      </button>
    )
  }

  function Scale({
    label,
    icon,
    value,
    onChange,
  }: {
    label: string
    icon: React.ReactNode
    value: number
    onChange: (value: number) => void
  }) {
    return (
      <div
        className={`rounded-2xl border p-4 ${
          dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={dark ? 'text-violet-300' : 'text-violet-600'}>{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
          </div>
          <span className="text-xs opacity-60">{scaleLabel(value, lang)}</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onChange(item)}
              aria-label={`${label}: ${item}`}
              className={`mind-control h-10 rounded-xl text-sm font-bold transition-all ${
                item === value
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : dark
                    ? 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]'
                    : 'bg-slate-100 text-slate-500 hover:bg-violet-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className={`mind-page relative min-h-full overflow-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8 ${
        dark ? 'bg-[#08070f] text-slate-100' : 'bg-[#f7f7fb] text-slate-900'
      }`}
    >
      <style>{`
        .mind-page { --mind-accent: 139 92 246; }
        .mind-orb { position:absolute; border-radius:9999px; filter:blur(55px); pointer-events:none; opacity:.28; animation: mindFloat 10s ease-in-out infinite; }
        .mind-orb.one { width:240px;height:240px;top:-90px;right:4%;background:rgb(139 92 246); }
        .mind-orb.two { width:190px;height:190px;top:36%;left:-80px;background:rgb(59 130 246);animation-delay:-3s; }
        .mind-orb.three { width:220px;height:220px;bottom:-100px;right:24%;background:rgb(236 72 153);animation-delay:-6s; }
        .mind-grid { background-image:linear-gradient(rgba(139,92,246,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.055) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,black,transparent 85%); }
        .mind-card { animation: mindRise .55s cubic-bezier(.2,.8,.2,1) both; }
        .mind-card:hover { transform:translateY(-3px); }
        .mind-card, .mind-control { transition:transform .28s ease, box-shadow .28s ease, border-color .28s ease, background-color .28s ease; }
        .mind-control:hover { transform:translateY(-2px) scale(1.01); }
        .mind-shine { position:relative; overflow:hidden; }
        .mind-shine::after { content:""; position:absolute; inset:-80% -30%; background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.16) 50%,transparent 65%); transform:translateX(-70%) rotate(8deg); transition:transform .8s ease; pointer-events:none; }
        .mind-shine:hover::after { transform:translateX(70%) rotate(8deg); }
        .mind-pop { animation: mindPop .42s cubic-bezier(.17,.89,.32,1.28) both; }
        .mind-pulse { animation: mindPulse 2.8s ease-in-out infinite; }
        .mind-stagger > * { animation: mindRise .55s cubic-bezier(.2,.8,.2,1) both; }
        .mind-stagger > *:nth-child(2){animation-delay:.05s}.mind-stagger > *:nth-child(3){animation-delay:.1s}.mind-stagger > *:nth-child(4){animation-delay:.15s}.mind-stagger > *:nth-child(5){animation-delay:.2s}.mind-stagger > *:nth-child(6){animation-delay:.25s}.mind-stagger > *:nth-child(7){animation-delay:.3s}
        @keyframes mindRise { from { opacity:0; transform:translateY(18px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes mindPop { from { opacity:0; transform:scale(.82); } to { opacity:1; transform:scale(1); } }
        @keyframes mindFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(0,-20px,0) scale(1.06)} }
        @keyframes mindPulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.16)}50%{box-shadow:0 0 0 12px rgba(139,92,246,0)} }
        @media (prefers-reduced-motion: reduce) {
          .mind-orb,.mind-card,.mind-pop,.mind-pulse,.mind-stagger > * { animation:none !important; }
          .mind-card,.mind-control { transition:none !important; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 mind-grid opacity-70" aria-hidden="true" />
      <div className="mind-orb one" aria-hidden="true" />
      <div className="mind-orb two" aria-hidden="true" />
      <div className="mind-orb three" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mind-card">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="mind-pop mind-pulse rounded-2xl bg-violet-500/10 p-3.5 text-violet-500 ring-1 ring-violet-500/10">
                <Brain size={26} />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">{t.title}</h1>
                <p className="mt-1 text-sm opacity-60">{t.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className={`mind-control mind-shine min-h-11 rounded-xl border px-4 text-sm font-bold ${
                dark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'
              }`}
            >
              {lang === 'fa' ? 'EN' : 'FA'}
            </button>

            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${
                dark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'
              }`}
            >
              <History size={17} />
              {t.history}
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              type="button"
              onClick={startNew}
              className="mind-control mind-shine flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
            >
              <Plus size={17} />
              {t.new}
            </button>
          </div>
        </header>

        {showHistory && (
          <section
            className={`mind-card rounded-3xl border p-4 sm:p-5 shadow-sm backdrop-blur-xl ${
              dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/85 shadow-slate-200/50'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">{t.history}</h2>
              <span className="text-xs opacity-50">{records.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin opacity-50" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-sm opacity-50">{t.noRecords}</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className={`mind-control rounded-2xl border p-4 ${
                      dark ? 'border-white/10 bg-black/20 hover:bg-white/[0.055]' : 'border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-violet-50/50'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">
                          {formatDate(record.checkInDate, lang)}
                        </div>
                        <div className="mt-1 text-xs opacity-50">
                          {t.mood}: {moodEmoji[Math.max(0, Math.min(4, record.mood - 1))]} {record.mood}/5
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => editRecord(record)}
                          className="rounded-lg p-2 opacity-60 transition hover:bg-violet-500/10 hover:text-violet-500 hover:opacity-100"
                          aria-label={t.edit}
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteRecord(record.id)}
                          disabled={deletingId === record.id}
                          className="rounded-lg p-2 opacity-60 transition hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                          aria-label={t.delete}
                        >
                          {deletingId === record.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {record.note && (
                      <p className="line-clamp-2 text-xs leading-6 opacity-65">{record.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {error && (
          <div className="mind-card mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 shadow-lg shadow-red-500/5">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        {form.feelingSafe === false && (
          <div className="mind-card mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-7 text-red-600 shadow-lg shadow-red-500/5 dark:text-red-300">
            <ShieldCheck className="mt-1 shrink-0" size={20} />
            <div>
              <div className="mb-1 font-bold">
                {lang === 'fa' ? 'اول از همه امنیتت' : 'Your safety comes first'}
              </div>
              <div>{t.safety}</div>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <main className="space-y-5">
            <section
              className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl sm:p-6 ${
                dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Smile size={19} className="text-violet-500" />
                    <h2 className="font-bold">{t.mood}</h2>
                  </div>
                  <p className="text-xs opacity-50">{formatDate(form.checkInDate, lang)}</p>
                </div>

                <input
                  type="date"
                  value={form.checkInDate}
                  onChange={(event) => setValue('checkInDate', event.target.value)}
                  className={`mind-control min-h-11 rounded-xl border px-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${
                    dark
                      ? 'border-white/10 bg-white/[0.04]'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                />
              </div>

              <div className="mind-stagger grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setValue('mood', item)}
                    className={`mind-control mind-shine rounded-2xl border p-3 transition-all sm:p-4 ${
                      form.mood === item
                        ? 'border-violet-500 bg-violet-500/10 shadow-md shadow-violet-500/10'
                        : dark
                          ? 'border-white/10 bg-white/[0.025] hover:bg-white/[0.06]'
                          : 'border-slate-100 bg-slate-50 hover:bg-violet-50'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl">
                      {moodEmoji[item - 1]}
                    </div>
                    <div className="mt-2 text-xs font-bold opacity-60">{item}/5</div>
                  </button>
                ))}
              </div>
            </section>

            <section
              className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl sm:p-6 ${
                dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
            >
              <div className="mb-5 flex items-center gap-2">
                <Activity size={19} className="text-violet-500" />
                <h2 className="font-bold">
                  {lang === 'fa' ? 'امروز چه خبر بود؟' : 'How was your day?'}
                </h2>
              </div>

              <div className="mind-stagger grid gap-3 sm:grid-cols-2">
                <Scale
                  label={t.sadness}
                  icon={<Heart size={16} />}
                  value={form.sadness}
                  onChange={(value) => setValue('sadness', value)}
                />
                <Scale
                  label={t.anger}
                  icon={<Zap size={16} />}
                  value={form.anger}
                  onChange={(value) => setValue('anger', value)}
                />
                <Scale
                  label={t.anxiety}
                  icon={<Brain size={16} />}
                  value={form.anxiety}
                  onChange={(value) => setValue('anxiety', value)}
                />
                <Scale
                  label={t.energy}
                  icon={<Activity size={16} />}
                  value={form.energy}
                  onChange={(value) => setValue('energy', value)}
                />
                <Scale
                  label={t.sleep}
                  icon={<Moon size={16} />}
                  value={form.sleepQuality}
                  onChange={(value) => setValue('sleepQuality', value)}
                />
                <Scale
                  label={t.happiness}
                  icon={<Smile size={16} />}
                  value={form.happiness}
                  onChange={(value) => setValue('happiness', value)}
                />
                <Scale
                  label={t.selfCare}
                  icon={<Sparkles size={16} />}
                  value={form.selfCare}
                  onChange={(value) => setValue('selfCare', value)}
                />
              </div>
            </section>

            <section
              className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl sm:p-6 ${
                dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-sm font-bold">{t.cried}</label>
                  <div className="flex gap-2">
                    <Choice
                      value={true}
                      current={form.cried}
                      onClick={() => setValue('cried', true)}
                      label={t.yes}
                    />
                    <Choice
                      value={false}
                      current={form.cried}
                      onClick={() => setValue('cried', false)}
                      label={t.no}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold">{t.safe}</label>
                  <div className="flex gap-2">
                    <Choice
                      value={true}
                      current={form.feelingSafe}
                      onClick={() => setValue('feelingSafe', true)}
                      label={t.yes}
                    />
                    <Choice
                      value={false}
                      current={form.feelingSafe}
                      onClick={() => setValue('feelingSafe', false)}
                      label={t.no}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold">{t.bothering}</label>
                  <textarea
                    value={form.bothering}
                    onChange={(event) => setValue('bothering', event.target.value)}
                    placeholder={t.botheringPlaceholder}
                    rows={3}
                    className={`mind-control w-full resize-none rounded-2xl border p-4 text-sm leading-7 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${
                      dark
                        ? 'border-white/10 bg-white/[0.03] placeholder:text-slate-600'
                        : 'border-slate-200 bg-slate-50 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">{t.note}</label>
                  <textarea
                    value={form.note}
                    onChange={(event) => setValue('note', event.target.value)}
                    placeholder={t.notePlaceholder}
                    rows={4}
                    className={`mind-control w-full resize-none rounded-2xl border p-4 text-sm leading-7 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${
                      dark
                        ? 'border-white/10 bg-white/[0.03] placeholder:text-slate-600'
                        : 'border-slate-200 bg-slate-50 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveCheckIn()}
                disabled={saving}
                className="mind-shine mind-control flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 px-5 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : saved ? (
                  <Check size={19} />
                ) : (
                  <Save size={19} />
                )}
                {saved ? t.saved : editingId !== null ? t.update : t.save}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={startNew}
                  className={`min-h-12 rounded-2xl border px-6 font-bold ${
                    dark
                      ? 'border-white/10 bg-white/[0.04]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <X size={18} className="inline-block" />
                </button>
              )}
            </div>
          </main>

          <aside className="space-y-5">
            <section
              className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl ${
                dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-500" />
                <h2 className="font-bold">{t.score}</h2>
              </div>

              <div className="mb-4 flex items-end gap-2">
                <span className="bg-gradient-to-br from-violet-600 to-fuchsia-500 bg-clip-text text-5xl font-black tracking-tight text-transparent">{score}</span>
                <span className="mb-1 text-sm opacity-50">/100</span>
              </div>

              <div className={`h-3 overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-7 opacity-65">{suggestion}</p>
            </section>

            <section
              className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl ${
                dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
              }`}
            >
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <h2 className="font-bold">
                  {lang === 'fa' ? 'یادآوری' : 'Reminder'}
                </h2>
              </div>

              <p className="text-sm leading-7 opacity-60">
                {lang === 'fa'
                  ? 'این بخش برای ثبت حال و احساساته و تشخیص پزشکی یا روان‌شناختی انجام نمی‌ده.'
                  : 'This section is for tracking feelings and does not provide a medical or psychological diagnosis.'}
              </p>
            </section>

            {records.length > 0 && (
              <section
                className={`mind-card rounded-3xl border p-5 shadow-sm backdrop-blur-xl ${
                  dark ? 'border-white/10 bg-white/[0.045] shadow-black/20' : 'border-slate-200/80 bg-white/90 shadow-slate-200/50'
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <History size={18} className="text-violet-500" />
                  <h2 className="font-bold">
                    {lang === 'fa' ? 'آخرین وضعیت' : 'Latest'}
                  </h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="opacity-50">{t.mood}</span>
                    <span className="font-bold">
                      {moodEmoji[Math.max(0, Math.min(4, records[0].mood - 1))]} {records[0].mood}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-50">{t.energy}</span>
                    <span className="font-bold">{records[0].energy ?? '-'}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-50">{t.sleep}</span>
                    <span className="font-bold">{records[0].sleepQuality ?? '-'}/5</span>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
