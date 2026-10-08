
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import JalaliDatePicker from '../components/JalaliDatePicker'
import { useLanguage } from '../i18n/LanguageContext'

type Filter =
  | 'all'
  | 'active'
  | 'completed'

type Priority =
  | 'low'
  | 'medium'
  | 'high'

function formatJalaliDate(
  value: string | null,
) {
  if (!value) {
    return ''
  }

  const parts =
    value.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}`
}

function getPriorityLabel(
  priority: Priority,
  language: string,
) {
  if (language === 'fa') {
    if (priority === 'high') {
      return 'زیاد'
    }

    if (priority === 'low') {
      return 'کم'
    }

    return 'متوسط'
  }

  if (priority === 'high') {
    return 'High'
  }

  if (priority === 'low') {
    return 'Low'
  }

  return 'Medium'
}

function getStatusLabel(
  status: RailyTodo['status'],
  language: string,
) {
  if (language === 'fa') {
    if (status === 'completed') {
      return 'تکمیل شده'
    }

    if (status === 'overdue') {
      return 'زمان گذشته'
    }

    return 'در انتظار'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  if (status === 'overdue') {
    return 'Time passed'
  }

  return 'Pending'
}

export default function Todo() {
  const {
    language,
    theme,
  } = useLanguage()

  const isPersian =
    language === 'fa'

  const isDark =
    theme === 'dark' ||
    (
      theme === 'system' &&
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
    )

  const [todos, setTodos] =
    useState<RailyTodo[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState<Filter>('all')

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [title, setTitle] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [priority, setPriority] =
    useState<Priority>('medium')

  const [dueDate, setDueDate] =
    useState('')

  const [dueTime, setDueTime] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    loadTodos()
  }, [])

  async function loadTodos() {
    try {
      setLoading(true)
      setError('')

      const result =
        await window.raily.todos.get()

      setTodos(result)
    } catch (loadError) {
      console.error(
        loadError,
      )

      setError(
        isPersian
          ? 'بارگذاری کارها انجام نشد.'
          : 'Failed to load tasks.',
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setDueTime('')
    setEditingId(null)
    setShowForm(false)
  }

  function openCreateForm() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setDueTime('')
    setError('')
    setShowForm(true)
  }

  function openEditForm(
    todo: RailyTodo,
  ) {
    if (
      todo.status === 'overdue'
    ) {
      return
    }

    setEditingId(todo.id)
    setTitle(todo.title)
    setDescription(
      todo.description ?? '',
    )
    setPriority(todo.priority)
    setDueDate(
      todo.dueDate ?? '',
    )
    setDueTime(
      todo.dueTime ?? '',
    )
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    const trimmedTitle =
      title.trim()

    if (!trimmedTitle) {
      setError(
        isPersian
          ? 'عنوان کار را وارد کنید.'
          : 'Please enter a task title.',
      )
      return
    }

    if (
      dueTime &&
      !/^\d{2}:\d{2}$/.test(
        dueTime,
      )
    ) {
      setError(
        isPersian
          ? 'ساعت واردشده معتبر نیست.'
          : 'The selected time is invalid.',
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editingId !== null) {
        const updated =
          await window.raily.todos.update(
            editingId,
            {
              title: trimmedTitle,
              description:
                description.trim() ||
                null,
              priority,
              dueDate:
                dueDate || null,
              dueTime:
                dueTime || null,
            },
          )

        setTodos(
          (current) =>
            current.map(
              (todo) =>
                todo.id ===
                editingId
                  ? updated
                  : todo,
            ),
        )
      } else {
        const created =
          await window.raily.todos.create(
            {
              title: trimmedTitle,
              description:
                description.trim() ||
                null,
              priority,
              dueDate:
                dueDate || null,
              dueTime:
                dueTime || null,
            },
          )

        setTodos(
          (current) => [
            created,
            ...current,
          ],
        )
      }

      resetForm()
    } catch (submitError) {
      console.error(
        submitError,
      )

      setError(
        isPersian
          ? 'ذخیره کار انجام نشد.'
          : 'Failed to save the task.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleTodo(
    todo: RailyTodo,
  ) {
    if (
      todo.status === 'overdue'
    ) {
      return
    }

    try {
      const updated =
        await window.raily.todos.update(
          todo.id,
          {
            completed:
              !todo.completed,
          },
        )

      setTodos(
        (current) =>
          current.map(
            (item) =>
              item.id === todo.id
                ? updated
                : item,
          ),
      )
    } catch (toggleError) {
      console.error(
        toggleError,
      )

      setError(
        isPersian
          ? 'تغییر وضعیت کار انجام نشد.'
          : 'Failed to update the task.',
      )
    }
  }

  async function deleteTodo(
    id: number,
  ) {
    try {
      const result =
        await window.raily.todos.delete(
          id,
        )

      if (!result.success) {
        return
      }

      setTodos(
        (current) =>
          current.filter(
            (todo) =>
              todo.id !== id,
          ),
      )

      if (
        editingId === id
      ) {
        resetForm()
      }
    } catch (deleteError) {
      console.error(
        deleteError,
      )

      setError(
        isPersian
          ? 'حذف کار انجام نشد.'
          : 'Failed to delete the task.',
      )
    }
  }

  const filteredTodos =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return todos.filter(
        (todo) => {
          const matchesSearch =
            !query ||
            todo.title
              .toLowerCase()
              .includes(query) ||
            (
              todo.description ??
              ''
            )
              .toLowerCase()
              .includes(query)

          if (!matchesSearch) {
            return false
          }

          if (
            filter === 'active'
          ) {
            return (
              !todo.completed &&
              todo.status !==
                'overdue'
            )
          }

          if (
            filter ===
            'completed'
          ) {
            return todo.completed
          }

          return true
        },
      )
    }, [
      todos,
      search,
      filter,
    ])

  const activeCount =
    todos.filter(
      (todo) =>
        !todo.completed &&
        todo.status !==
          'overdue',
    ).length

  const completedCount =
    todos.filter(
      (todo) =>
        todo.completed,
    ).length

  const overdueCount =
    todos.filter(
      (todo) =>
        todo.status ===
        'overdue',
    ).length

  return (
    <div
      className={[
        'h-full overflow-y-auto',
        isDark
          ? 'text-slate-100'
          : 'text-slate-900',
      ].join(' ')}
      dir={
        isPersian
          ? 'rtl'
          : 'ltr'
      }
    >
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isPersian
                ? 'کارها'
                : 'To Do'}
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'کارهای روزانه و برنامه‌ریزی‌شده خود را مدیریت کنید.'
                : 'Manage your daily and scheduled tasks.'}
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />

            {isPersian
              ? 'کار جدید'
              : 'New Task'}
          </button>
        </div>

        {/* Stats */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'فعال'
                : 'Active'}
            </div>

            <div className="mt-2 text-2xl font-bold">
              {activeCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'تکمیل شده'
                : 'Completed'}
            </div>

            <div className="mt-2 text-2xl font-bold">
              {completedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/20">
            <div className="text-sm text-red-600 dark:text-red-400">
              {isPersian
                ? 'زمان گذشته'
                : 'Time Passed'}
            </div>

            <div className="mt-2 text-2xl font-bold text-red-700 dark:text-red-400">
              {overdueCount}
            </div>
          </div>
        </div>

        {/* Search + Filters */}

        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className={[
                'absolute top-1/2 -translate-y-1/2 text-slate-400',
                isPersian
                  ? 'right-4'
                  : 'left-4',
              ].join(' ')}
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
                isPersian
                  ? 'جستجوی کار...'
                  : 'Search tasks...'
              }
              className={[
                'min-h-11 w-full rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900',
                isPersian
                  ? 'pr-11 pl-4'
                  : 'pl-11 pr-4',
              ].join(' ')}
            />
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {(
              [
                'all',
                'active',
                'completed',
              ] as Filter[]
            ).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilter(
                      item,
                    )
                  }
                  className={[
                    'rounded-lg px-4 py-2 text-sm font-medium transition',
                    filter ===
                    item
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                  ].join(
                    ' ',
                  )}
                >
                  {item ===
                  'all'
                    ? isPersian
                      ? 'همه'
                      : 'All'
                    : item ===
                        'active'
                      ? isPersian
                        ? 'فعال'
                        : 'Active'
                      : isPersian
                        ? 'تکمیل شده'
                        : 'Completed'}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle
              size={18}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* Form */}

        {showForm && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId !==
                null
                  ? isPersian
                    ? 'ویرایش کار'
                    : 'Edit Task'
                  : isPersian
                    ? 'افزودن کار جدید'
                    : 'Add New Task'}
              </h2>

              <button
                type="button"
                onClick={
                  resetForm
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isPersian
                    ? 'عنوان'
                    : 'Title'}
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(
                    event,
                  ) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder={
                    isPersian
                      ? 'مثلاً مطالعه جاوااسکریپت'
                      : 'e.g. Study JavaScript'
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {isPersian
                    ? 'توضیحات'
                    : 'Description'}
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder={
                    isPersian
                      ? 'توضیحات اختیاری...'
                      : 'Optional description...'
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {isPersian
                      ? 'اولویت'
                      : 'Priority'}
                  </label>

                  <select
                    value={
                      priority
                    }
                    onChange={(
                      event,
                    ) =>
                      setPriority(
                        event.target
                          .value as Priority,
                      )
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="low">
                      {getPriorityLabel(
                        'low',
                        language,
                      )}
                    </option>

                    <option value="medium">
                      {getPriorityLabel(
                        'medium',
                        language,
                      )}
                    </option>

                    <option value="high">
                      {getPriorityLabel(
                        'high',
                        language,
                      )}
                    </option>
                  </select>
                </div>

                <JalaliDatePicker
                  value={
                    dueDate
                  }
                  onChange={
                    setDueDate
                  }
                  label={
                    isPersian
                      ? 'تاریخ انجام'
                      : 'Due Date'
                  }
                  placeholder={
                    isPersian
                      ? 'انتخاب تاریخ شمسی'
                      : 'Select date'
                  }
                />

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {isPersian
                      ? 'ساعت انجام'
                      : 'Due Time'}
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className={[
                        'absolute top-1/2 -translate-y-1/2 text-slate-400',
                        isPersian
                          ? 'right-4'
                          : 'left-4',
                      ].join(
                        ' ',
                      )}
                    />

                    <input
                      type="time"
                      value={
                        dueTime
                      }
                      onChange={(
                        event,
                      ) =>
                        setDueTime(
                          event.target
                            .value,
                        )
                      }
                      className={[
                        'min-h-11 w-full rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950',
                        isPersian
                          ? 'pr-11 pl-4'
                          : 'pl-11 pr-4',
                      ].join(' ')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {isPersian
                    ? 'لغو'
                    : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? isPersian
                      ? 'در حال ذخیره...'
                      : 'Saving...'
                    : editingId !==
                        null
                      ? isPersian
                        ? 'ذخیره تغییرات'
                        : 'Save Changes'
                      : isPersian
                        ? 'افزودن کار'
                        : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Todo list */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {isPersian
              ? 'در حال بارگذاری...'
              : 'Loading...'}
          </div>
        ) : filteredTodos.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <CheckCircle2
              size={42}
              className="mx-auto text-slate-300 dark:text-slate-700"
            />

            <h3 className="mt-4 font-semibold">
              {isPersian
                ? 'کاری پیدا نشد'
                : 'No tasks found'}
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isPersian
                ? 'یک کار جدید اضافه کنید.'
                : 'Add a new task to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map(
              (todo) => {
                const overdue =
                  todo.status ===
                  'overdue'

                return (
                  <div
                    key={todo.id}
                    className={[
                      'rounded-2xl border bg-white p-5 transition dark:bg-slate-900',
                      overdue
                        ? 'border-red-300 bg-red-50/40 dark:border-red-900/70 dark:bg-red-950/20'
                        : 'border-slate-200 dark:border-slate-800',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="flex gap-4">
                      <button
                        type="button"
                        disabled={
                          overdue
                        }
                        onClick={() =>
                          toggleTodo(
                            todo,
                          )
                        }
                        className={[
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
                          todo.completed
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : overdue
                              ? 'cursor-not-allowed border-red-300 text-red-400'
                              : 'border-slate-300 hover:border-blue-500 dark:border-slate-600',
                        ].join(
                          ' ',
                        )}
                      >
                        {todo.completed && (
                          <Check
                            size={14}
                          />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3
                              className={[
                                'font-semibold',
                                todo.completed
                                  ? 'text-slate-400 line-through'
                                  : overdue
                                    ? 'text-red-700 dark:text-red-400'
                                    : '',
                              ].join(
                                ' ',
                              )}
                            >
                              {
                                todo.title
                              }
                            </h3>

                            {todo.description && (
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {
                                  todo.description
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={[
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                todo.priority ===
                                'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                  : todo.priority ===
                                      'low'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
                              ].join(
                                ' ',
                              )}
                            >
                              {getPriorityLabel(
                                todo.priority,
                                language,
                              )}
                            </span>

                            <span
                              className={[
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                overdue
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                  : todo.completed
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                              ].join(
                                ' ',
                              )}
                            >
                              {getStatusLabel(
                                todo.status,
                                language,
                              )}
                            </span>
                          </div>
                        </div>

                        {(todo.dueDate ||
                          todo.dueTime) && (
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            {todo.dueDate && (
                              <span className="inline-flex items-center gap-1.5">
                                📅
                                {formatJalaliDate(
                                  todo.dueDate,
                                )}
                              </span>
                            )}

                            {todo.dueTime && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3
                                  size={14}
                                />
                                {
                                  todo.dueTime
                                }
                              </span>
                            )}
                          </div>
                        )}

                        {overdue && (
                          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-100 px-3 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                            <AlertCircle
                              size={18}
                            />

                            <span>
                              {isPersian
                                ? '⚠️ این کار انجام نشد! زمان تعیین‌شده برای انجام این کار گذشته است.'
                                : '⚠️ This task was not completed. Its scheduled time has passed.'}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={
                              overdue
                            }
                            onClick={() =>
                              openEditForm(
                                todo,
                              )
                            }
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Edit3
                              size={14}
                            />

                            {isPersian
                              ? 'ویرایش'
                              : 'Edit'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteTodo(
                                todo.id,
                              )
                            }
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2
                              size={14}
                            />

                            {isPersian
                              ? 'حذف'
                              : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </div>
    </div>
  )
}