import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check, X, Settings2, Loader2 } from './icons'
import BottomSheet from './BottomSheet'
import ConfirmDialog from './ConfirmDialog'
import TextField from './TextField'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useMoods } from '../hooks/useMoods'
import { useToast } from '../context/ToastContext'
import { todayISO } from '../lib/dateUtils'
import { useI18n } from '../i18n'

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Sheet full màn hình để check-in / sửa check-in (mở từ FAB, thẻ hôm nay, lịch sử…).
// `request` = { id, date, nonce }: mỗi lần mở nonce đổi → form được mount lại với state sạch.
export default function CheckInSheet({ open, request, onClose }) {
  const { t } = useI18n()
  if (!request?.nonce) return null
  return <CheckInForm key={request.nonce} open={open} request={request} onClose={onClose} t={t} />
}

function CheckInForm({ open, request, onClose, t }) {
  const { id, date: dateFromQuery } = request
  const { entries, loading: entriesLoading, addEntry, updateEntry } = useMoodEntries()
  const { activities, loading: activitiesLoading } = useActivities()
  const { moods, moodByKey, loading: moodsLoading } = useMoods()
  const dataLoading = entriesLoading || activitiesLoading || moodsLoading
  const { showToast } = useToast()
  const noteRef = useRef(null)

  const today = todayISO()
  const existing = id ? entries.find((e) => e.id === id) : entries.find((e) => e.date === (dateFromQuery || today))

  const defaultDatetime = existing?.time
    ? toDatetimeLocalValue(new Date(existing.time))
    : dateFromQuery
      ? `${dateFromQuery}T${toDatetimeLocalValue(new Date()).slice(11)}`
      : toDatetimeLocalValue(new Date())

  const [mood, setMood] = useState(existing?.mood ?? null)
  const [selectedActivities, setSelectedActivities] = useState(existing?.activities ?? [])
  const [note, setNote] = useState(existing?.note ?? '')
  const [datetime, setDatetime] = useState(defaultDatetime)
  const [saving, setSaving] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)

  // Dữ liệu có thể tải xong sau khi sheet đã mở → đồng bộ form khi bản ghi tương ứng xuất hiện.
  useEffect(() => {
    if (existing) {
      setMood(existing.mood)
      setSelectedActivities(existing.activities || [])
      setNote(existing.note || '')
      setDatetime(toDatetimeLocalValue(new Date(existing.time)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id])

  // Ô ghi chú tự giãn theo nội dung.
  useEffect(() => {
    const el = noteRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note, dataLoading])

  function toggleActivity(activityId) {
    setSelectedActivities((cur) => (cur.includes(activityId) ? cur.filter((v) => v !== activityId) : [...cur, activityId]))
  }

  async function performSave() {
    setSaving(true)
    try {
      const moodDef = moodByKey(mood)
      const combined = new Date(datetime)
      const payload = {
        date: toDatetimeLocalValue(combined).slice(0, 10),
        time: combined.toISOString(),
        mood,
        score: moodDef.score,
        activities: selectedActivities,
        note
      }
      if (existing) await updateEntry(existing.id, payload)
      else await addEntry(payload)
      setConfirmSaveOpen(false)
      showToast(existing ? t('checkin.updated') : t('checkin.saved'))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function handleSave() {
    if (!mood || saving) return
    if (existing) setConfirmSaveOpen(true)
    else performSave()
  }

  const footer = (
    <div className="grid grid-cols-2 gap-4 w-full">
      <button onClick={onClose} disabled={saving} className="btn btn-tonal btn-lg state">
        <X size={18} />
        {t('common.cancel')}
      </button>
      <button
        onClick={handleSave}
        disabled={!mood || saving || dataLoading}
        className="btn btn-filled btn-lg state flex-1 md:flex-none md:min-w-[14rem] md:ml-auto"
      >
        {saving ? <Loader2 size={18} /> : <Check size={18} />}
        {saving ? t('common.saving') : existing ? t('common.update') : t('checkin.save')}
      </button>
    </div>
  )

  return (
    <BottomSheet
      open={open}
      fullScreen
      dismissOnBackdrop={false}
      title={existing ? t('checkin.editTitle') : t('checkin.title')}
      onClose={onClose}
      footer={footer}
    >
      <ConfirmDialog
        open={confirmSaveOpen}
        title={t('checkin.confirmTitle')}
        description={t('checkin.confirmText')}
        confirmLabel={t('common.update')}
        onConfirm={performSave}
        onCancel={() => setConfirmSaveOpen(false)}
      />

      {dataLoading ? (
        <FormSkeleton />
      ) : (
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <p className="t-body-large text-on-surface-variant mb-6">{t('checkin.subtitle')}</p>

          <TextField
            label={t('checkin.datetime')}
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="mb-8"
          />

          <div className="flex justify-between md:justify-center md:gap-8 mb-9" role="radiogroup" aria-label={t('checkin.subtitle')}>
            {moods.map((m) => {
              const selected = mood === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  role="radio"
                  aria-checked={selected}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span
                    className="state w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl transition-[transform,background-color] duration-200 ease-emphasized"
                    style={{
                      background: selected ? m.color + '66' : 'var(--c-surface-container)',
                      outline: selected ? `2px solid ${m.color}` : '2px solid transparent',
                      transform: selected ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {m.emoji}
                  </span>
                  <span className={`t-label-medium ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{m.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="t-title-medium">{t('checkin.activities')}</p>
              <Link to="/manage/activities" onClick={onClose} className="btn btn-text state -mr-3">
                <Settings2 size={18} />
                {t('checkin.manage')}
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {activities.map((a) => {
                const active = selectedActivities.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleActivity(a.id)}
                    aria-pressed={active}
                    className={`chip state ${active ? 'chip-selected' : ''} flex items-center justify-center`}
                  >
                    {active ? <Check size={18} className="-ml-1" /> : <span className="-ml-0.5">{a.emoji}</span>}
                    {a.label}
                  </button>
                )
              })}
              <Link to="/manage/activities" onClick={onClose} className="chip state text-brand flex items-center justify-center">
                <Plus size={18} className="-ml-1" />
                {t('checkin.addNew')}
              </Link>
            </div>
          </div>

          <TextField
            as="textarea"
            ref={noteRef}
            label={t('checkin.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('checkin.notePlaceholder')}
            rows={3}
          />
        </div>
      )}
    </BottomSheet>
  )
}

function FormSkeleton() {
  return (
    <div className="max-w-lg md:max-w-2xl mx-auto space-y-6" aria-hidden="true">
      <div className="skeleton h-5 w-2/3 rounded-md" />
      <div className="skeleton h-11 w-full rounded-md" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton w-full h-14 rounded-md" />
        ))}
      </div>
      <div className="skeleton h-24 w-full rounded-md" />
    </div>
  )
}
