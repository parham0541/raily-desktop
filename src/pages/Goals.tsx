import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CheckCircle2,
  Edit3,
  Flag,
  Plus,
  Search,
  Target,
  Trash2,
  X,
} from 'lucide-react'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import JalaliDatePicker from '../components/JalaliDatePicker'

type GoalStatus =
  | 'active'
  | 'completed'
  | 'cancelled'

type GoalForm = {
  title: string
  description: string
  category: string
  progress: number

  // فقط تاریخ؛ بدون ساعت
  startDate: string
  targetDate: string

  status: GoalStatus
}

const emptyForm: GoalForm = {
  title: '',
  description: '',
  category: 'general',
  progress: 0,
  startDate: '',
  targetDate: '',
  status: 'active',
}

const translations = {
  en: {
    title: 'Goals',
    subtitle:
      'Track your long-term goals and progress.',

    activeGoals: 'Active Goals',
    completed: 'Completed',
    averageProgress: 'Average Progress',

    search: 'Search goals...',

    all: 'All',
    active: 'Active',
    cancelled: 'Cancelled',

    newGoal: 'New Goal',
    noGoals: 'No goals found.',

    createGoal: 'Create Goal',
    editGoal: 'Edit Goal',

    goalTitle: 'Goal title',
    description: 'Description',
    category: 'Category',
    progress: 'Progress',

    startDate: 'Start date',
    targetDate: 'End date',

    status: 'Status',

    general: 'General',
    career: 'Career',
    education: 'Education',
    health: 'Health',
    finance: 'Finance',
    personal: 'Personal',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',

    deleteGoal: 'Delete Goal',
    deleteConfirm:
      'Are you sure you want to delete this goal?',

    completedStatus: 'Completed',
    activeStatus: 'Active',
    cancelledStatus: 'Cancelled',

    noDescription: 'No description',
    loading: 'Loading...',
  },

  fa: {
    title: 'اهداف',
    subtitle:
      'اهداف بلندمدت و میزان پیشرفت خود را دنبال کنید.',

    activeGoals: 'اهداف فعال',
    completed: 'تکمیل شده',
    averageProgress: 'میانگین پیشرفت',

    search: 'جستجوی اهداف...',

    all: 'همه',
    active: 'فعال',
    cancelled: 'لغو شده',

    newGoal: 'هدف جدید',
    noGoals: 'هدفی پیدا نشد.',

    createGoal: 'ایجاد هدف',
    editGoal: 'ویرایش هدف',

    goalTitle: 'عنوان هدف',
    description: 'توضیحات',
    category: 'دسته‌بندی',
    progress: 'پیشرفت',

    startDate: 'تاریخ شروع',
    targetDate: 'تاریخ پایان',

    status: 'وضعیت',

    general: 'عمومی',
    career: 'شغلی',
    education: 'تحصیلی',
    health: 'سلامت',
    finance: 'مالی',
    personal: 'شخصی',

    save: 'ذخیره',
    cancel: 'لغو',
    delete: 'حذف',
    edit: 'ویرایش',

    deleteGoal: 'حذف هدف',
    deleteConfirm:
      'آیا مطمئن هستید که می‌خواهید این هدف را حذف کنید؟',

    completedStatus: 'تکمیل شده',
    activeStatus: 'فعال',
    cancelledStatus: 'لغو شده',

    noDescription: 'بدون توضیحات',
    loading: 'در حال بارگذاری...',
  },
}

export default function Goals() {
  const {
    language,
  } = useLanguage()

  const t =
    translations[language]

  const isRTL =
    language === 'fa'

  const [
    goals,
    setGoals,
  ] = useState<RailyGoal[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'all' | GoalStatus
  >('all')

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false)

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(null)

  const [
    form,
    setForm,
  ] = useState<GoalForm>(
    emptyForm,
  )

  const [
    deleteId,
    setDeleteId,
  ] = useState<number | null>(null)

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      setLoading(true)

      const data =
        await window.raily.goals.get()

      setGoals(data)
    } finally {
      setLoading(false)
    }
  }

  const filteredGoals =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return goals.filter(
        (goal) => {
          const matchesSearch =
            !query ||
            goal.title
              .toLowerCase()
              .includes(query) ||
            (
              goal.description ??
              ''
            )
              .toLowerCase()
              .includes(query)

          const matchesStatus =
            statusFilter === 'all' ||
            goal.status ===
              statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      goals,
      search,
      statusFilter,
    ])

  const activeCount =
    goals.filter(
      (goal) =>
        goal.status === 'active',
    ).length

  const completedCount =
    goals.filter(
      (goal) =>
        goal.status === 'completed',
    ).length

  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (
              sum,
              goal,
            ) =>
              sum +
              goal.progress,
            0,
          ) /
            goals.length,
        )
      : 0

  function openCreateModal() {
    setEditingId(null)
    setForm({
      ...emptyForm,
    })
    setModalOpen(true)
  }

  function openEditModal(
    goal: RailyGoal,
  ) {
    setEditingId(goal.id)

    setForm({
      title: goal.title,
      description:
        goal.description ??
        '',
      category:
        goal.category ??
        'general',
      progress:
        goal.progress,

      // فقط تاریخ شروع
      startDate:
        goal.startDate ??
        '',

      // فقط تاریخ پایان
      targetDate:
        goal.targetDate ??
        '',

      status:
        goal.status,
    })

    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm({
      ...emptyForm,
    })
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (
      !form.title.trim()
    ) {
      return
    }

    /*
     * Goals فقط تاریخ دارد.
     *
     * هیچ startTime یا targetTime
     * به بک‌اند ارسال نمی‌شود.
     */
    const payload = {
      title:
        form.title.trim(),

      description:
        form.description.trim() ||
        null,

      category:
        form.category,

      progress:
        form.progress,

      startDate:
        form.startDate ||
        null,

      targetDate:
        form.targetDate ||
        null,

      status:
        form.status,
    }

    if (
      editingId !== null
    ) {
      await window.raily.goals.update(
        editingId,
        payload,
      )
    } else {
      await window.raily.goals.create(
        payload,
      )
    }

    closeModal()
    await loadGoals()
  }

  async function handleDelete() {
    if (
      deleteId === null
    ) {
      return
    }

    await window.raily.goals.delete(
      deleteId,
    )

    setDeleteId(null)

    await loadGoals()
  }

  function statusLabel(
    status: GoalStatus,
  ) {
    if (
      status === 'active'
    ) {
      return t.activeStatus
    }

    if (
      status === 'completed'
    ) {
      return t.completedStatus
    }

    return t.cancelledStatus
  }

  function categoryLabel(
    category: string,
  ) {
    const labels:
      Record<
        string,
        string
      > = {
      general:
        t.general,

      career:
        t.career,

      education:
        t.education,

      health:
        t.health,

      finance:
        t.finance,

      personal:
        t.personal,
    }

    return (
      labels[category] ??
      category
    )
  }

  return (
    <div
      className={`h-full overflow-y-auto bg-slate-50 p-6 text-slate-900 dark:bg-[#07111f] dark:text-white ${
        isRTL
          ? 'rtl'
          : 'ltr'
      }`}
      dir={
        isRTL
          ? 'rtl'
          : 'ltr'
      }
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            {t.newGoal}
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.activeGoals}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Target size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.completed}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {completedCount}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2
                  size={22}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.averageProgress}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {averageProgress}%
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <Flag size={22} />
              </div>
            </div>
          </div>

        </div>

        {/* Search / Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                isRTL
                  ? 'right-3'
                  : 'left-3'
              }`}
            />

            <input
              type="text"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder={
                t.search
              }
              className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-[#0d1a2b] ${
                isRTL
                  ? 'pr-10 pl-4'
                  : 'pr-4 pl-10'
              }`}
            />
          </div>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | GoalStatus,
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-[#0d1a2b]"
          >
            <option value="all">
              {t.all}
            </option>

            <option value="active">
              {t.active}
            </option>

            <option value="completed">
              {t.completed}
            </option>

            <option value="cancelled">
              {t.cancelled}
            </option>
          </select>
        </div>

        {/* Goals */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#0d1a2b] dark:text-slate-400">
            {t.loading}
          </div>
        ) : filteredGoals.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#0d1a2b]">
            <Target
              size={40}
              className="mx-auto mb-3 text-slate-400"
            />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.noGoals}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {filteredGoals.map(
              (goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#0d1a2b] dark:hover:border-slate-700"
                >

                  {/* Goal header */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">
                        {goal.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {categoryLabel(
                            goal.category,
                          )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {statusLabel(
                            goal.status,
                          )}
                        </span>

                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            goal,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                        title={
                          t.edit
                        }
                      >
                        <Edit3
                          size={17}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteId(
                            goal.id,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        title={
                          t.delete
                        }
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 min-h-10 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {goal.description ||
                      t.noDescription}
                  </p>

                  {/* Progress */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">

                      <span className="font-medium">
                        {t.progress}
                      </span>

                      <span className="font-semibold">
                        {goal.progress}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${goal.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  {(goal.startDate ||
                    goal.targetDate) && (
                    <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">

                      {goal.startDate && (
                        <span>
                          {t.startDate}:{' '}
                          {
                            goal.startDate
                          }
                        </span>
                      )}

                      {goal.targetDate && (
                        <span>
                          {t.targetDate}:{' '}
                          {
                            goal.targetDate
                          }
                        </span>
                      )}

                    </div>
                  )}

                </div>
              ),
            )}

          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0d1a2b]">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-xl font-bold">
                {editingId !==
                null
                  ? t.editGoal
                  : t.createGoal}
              </h2>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t.goalTitle}
                </label>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        title:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-[#091525]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t.description}
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-[#091525]"
                />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {t.category}
                  </label>

                  <select
                    value={
                      form.category
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          category:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none dark:border-slate-700 dark:bg-[#091525]"
                  >
                    <option value="general">
                      {t.general}
                    </option>

                    <option value="career">
                      {t.career}
                    </option>

                    <option value="education">
                      {t.education}
                    </option>

                    <option value="health">
                      {t.health}
                    </option>

                    <option value="finance">
                      {t.finance}
                    </option>

                    <option value="personal">
                      {t.personal}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {t.status}
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          status:
                            event.target
                              .value as GoalStatus,
                        }),
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none dark:border-slate-700 dark:bg-[#091525]"
                  >
                    <option value="active">
                      {t.active}
                    </option>

                    <option value="completed">
                      {t.completed}
                    </option>

                    <option value="cancelled">
                      {t.cancelled}
                    </option>
                  </select>
                </div>

              </div>

              {/* Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-medium">
                    {t.progress}
                  </label>

                  <span className="text-sm font-semibold">
                    {form.progress}%
                  </span>

                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    form.progress
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        progress:
                          Number(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* فقط تاریخ شروع و پایان */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {t.startDate}
                  </label>

                  <JalaliDatePicker
                    value={
                      form.startDate
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          startDate:
                            value,
                        }),
                      )
                    }
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {t.targetDate}
                  </label>

                  <JalaliDatePicker
                    value={
                      form.targetDate
                    }
                    onChange={(
                      value,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          targetDate:
                            value,
                        }),
                      )
                    }
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {t.save}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId !==
        null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0d1a2b]">

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={22}
              />
            </div>

            <h2 className="text-lg font-bold">
              {t.deleteGoal}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t.deleteConfirm}
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(
                    null,
                  )
                }
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t.delete}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  )
}