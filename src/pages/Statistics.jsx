import { useMemo, useState } from 'react'
import { useSessionState, reviveDate } from '../hooks/useSessionState'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChevronLeft, ChevronRight, FileDown, Image as ImageIcon, Loader2, Smile, CalendarCheck2, Flame, Heart } from '../components/icons'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useThemeColors, useIsDark } from '../hooks/useIsDark'
import { CATEGORY_COLORS, REPORT_CATEGORY_COLORS } from '../lib/chartColors'
import { useMoods } from '../hooks/useMoods'
import { useI18n } from '../i18n'
import { calcStreak } from '../lib/dateUtils'
import { latestByDate, periodLabel, buildTimeSeries, moodDistribution, getBuckets } from '../lib/statsUtils'
import { exportStatsPdf, exportStatsImage } from '../lib/reportGenerator'
import { StatsBodySkeleton } from '../components/PageSkeleton'
import SegmentedButton from '../components/SegmentedButton'

const PERIODS = ['day', 'week', 'month', 'year']

export default function Statistics() {
  const { entries, loading: entriesLoading } = useMoodEntries()
  const { activities, loading: activitiesLoading } = useActivities()
  const { moods, moodByKey, loading: moodsLoading } = useMoods()
  const i18n = useI18n()
  const { t } = i18n
  const loading = entriesLoading || activitiesLoading || moodsLoading
  const [period, setPeriod] = useSessionState('stats.period', 'month')
  const [cursor, setCursor] = useSessionState('stats.cursor', () => new Date(), { revive: reviveDate })
  const [exporting, setExporting] = useState(null)
  // Màu literal (không dùng CSS var) để SVG của Recharts hiển thị đúng ở mọi theme / màu chủ đề.
  const c = useThemeColors()
  const isDark = useIsDark()

  const byDate = useMemo(() => latestByDate(entries), [entries])
  const activityById = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities])

  // timeSeries & activityStats chỉ còn dùng cho xuất báo cáo PDF/PNG.
  const timeSeries = useMemo(() => buildTimeSeries(period, cursor, byDate, i18n), [period, cursor, byDate, i18n])
  const periodEntries = useMemo(() => getBuckets(period, cursor, byDate, i18n).entries, [period, cursor, byDate, i18n])
  const distribution = useMemo(() => moodDistribution(periodEntries, moods), [periodEntries, moods])

  // Toàn bộ hoạt động trong kỳ, sắp theo số lần giảm dần.
  const activityAll = useMemo(() => {
    const counts = {}
    for (const e of periodEntries) for (const id of e.activities || []) counts[id] = (counts[id] || 0) + 1
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, label: activityById[id]?.label || '—', emoji: activityById[id]?.emoji || '❔' }))
      .sort((a, b) => b.count - a.count)
  }, [periodEntries, activityById])

  const activityStats = useMemo(() => activityAll.slice(0, 8), [activityAll])

  // Biểu đồ tròn hoạt động: hiển thị TẤT CẢ hoạt động, màu lặp lại theo bảng màu nếu nhiều hơn số màu.
  const buildActivityPie = (palette) => activityAll.map((a, i) => ({ ...a, color: palette[i % palette.length] }))
  const activityPie = useMemo(() => buildActivityPie(CATEGORY_COLORS(isDark)), [activityAll, isDark]) // eslint-disable-line react-hooks/exhaustive-deps

  // Biểu đồ cảm xúc: chỉ vẽ các cảm xúc có dữ liệu, còn chú thích liệt kê đủ tất cả.
  const moodPie = useMemo(() => distribution.filter((d) => d.count > 0), [distribution])

  const stats = useMemo(() => {
    const list = periodEntries
    const avg = list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : null
    const counts = {}
    for (const e of list) counts[e.mood] = (counts[e.mood] || 0) + 1
    const topKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { avg, checkinDays: list.length, streak: calcStreak(byDate), topMood: topKey ? moodByKey(topKey) : null }
  }, [periodEntries, byDate, moodByKey])

  const label = periodLabel(period, cursor, i18n)
  const periodOptions = PERIODS.map((k) => ({ key: k, label: t(`stats.period.${k}`) }))

  function shiftCursor(dir) {
    const d = new Date(cursor)
    if (period === 'day') d.setDate(d.getDate() + dir)
    if (period === 'week') d.setDate(d.getDate() + dir * 7)
    if (period === 'month') d.setMonth(d.getMonth() + dir)
    if (period === 'year') d.setFullYear(d.getFullYear() + dir)
    setCursor(d)
  }

  async function runExport(kind) {
    setExporting(kind)
    try {
      const args = { periodLabel: label, stats, distribution, timeSeries, activityStats, activityPie: buildActivityPie(REPORT_CATEGORY_COLORS), i18n }
      await (kind === 'pdf' ? exportStatsPdf(args) : exportStatsImage(args))
    } finally {
      setExporting(null)
    }
  }

  const hasData = periodEntries.length > 0
  const tooltipStyle = { fontSize: 12, borderRadius: 4, border: 'none', boxShadow: '0 1px 3px rgb(0 0 0 / .3)', background: c.surface, color: c.ink }
  const tooltipProps = { contentStyle: tooltipStyle, labelStyle: { color: c.ink }, itemStyle: { color: c.ink } }

  // Nhãn ngoài lát: emoji + %. Lát quá nhỏ (<3%) chỉ hiện emoji để không chồng chéo; chú thích bên dưới luôn đầy đủ.
  function pieLabel({ cx, cy, midAngle, outerRadius, percent, emoji, payload }) {
    if (!percent) return null
    const RAD = Math.PI / 180
    const r = outerRadius + 18
    const x = cx + r * Math.cos(-midAngle * RAD)
    const y = cy + r * Math.sin(-midAngle * RAD)
    const icon = emoji || payload?.emoji || ''
    const pct = `${(percent * 100).toFixed(0)}%`
    return (
      <text x={x} y={y} fill={c.ink} fontSize={12} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {percent < 0.03 ? icon : `${icon} ${pct}`}
      </text>
    )
  }

  const pieTooltip = (total) => (v, name, item) => [
    `${t('stats.times', { n: v })} (${Math.round((v / total) * 100)}%)`,
    `${item?.payload?.emoji || ''} ${name}`.trim(),
  ]

  const moodTotal = moodPie.reduce((a, d) => a + d.count, 0) || 1
  const activityTotal = activityPie.reduce((a, d) => a + d.count, 0) || 1

  return (
    <div className="page page-enter pb-4">
      <h1 className="t-headline-medium mb-5 pt-2">{t('stats.title')}</h1>

      <div className="md:flex md:items-center md:justify-between md:gap-6 mb-2">
        <SegmentedButton className="mb-4 md:mb-0 md:max-w-md" options={periodOptions} value={period} onChange={setPeriod} />

        <div className="flex items-center justify-between md:justify-center md:gap-4 mb-5 md:mb-0 md:min-w-[18rem]">
          <button onClick={() => shiftCursor(-1)} aria-label={t('stats.prev')} className="icon-btn state"><ChevronLeft size={24} /></button>
          <p className="t-title-medium text-center capitalize">{label}</p>
          <button onClick={() => shiftCursor(1)} aria-label={t('stats.next')} className="icon-btn state"><ChevronRight size={24} /></button>
        </div>
      </div>

      <div className="md:flex md:items-center md:gap-4 mb-8 md:mt-4">
        <p className="t-body-small text-on-surface-variant mb-2 md:mb-0 px-1">{t('stats.export', { period: t(`stats.word.${period}`) })}</p>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <button onClick={() => runExport('pdf')} disabled={!!exporting || !hasData} className="btn btn-filled state">
            {exporting === 'pdf' ? <Loader2 size={18} /> : <FileDown size={18} />}
            {exporting === 'pdf' ? t('stats.creating') : 'PDF'}
          </button>
          <button onClick={() => runExport('image')} disabled={!!exporting || !hasData} className="btn btn-tonal state">
            {exporting === 'image' ? <Loader2 size={18} /> : <ImageIcon size={18} />}
            {exporting === 'image' ? t('stats.creating') : t('stats.png')}
          </button>
        </div>
      </div>

      {loading ? (
        <StatsBodySkeleton />
      ) : (
        <>
          <div className="space-y-2 mb-8 md:space-y-0 md:grid md:grid-cols-2 2xl:grid-cols-4 md:gap-3">
            <StatRow icon={Smile} label={t('stats.avgMood')} value={stats.avg != null ? `${stats.avg.toFixed(1)}/5` : '—'} color="#8FBF7F" />
            <StatRow icon={CalendarCheck2} label={t('stats.checkinDays')} value={stats.checkinDays} color="#9FB8C8" />
            <StatRow icon={Flame} label={t('stats.streak')} value={stats.streak} color="#F0A34E" />
            <StatRow icon={Heart} label={t('stats.topMood')} value={stats.topMood?.label || '—'} emoji={stats.topMood?.emoji} color={stats.topMood?.color || '#7D8CB0'} />
          </div>

          {!hasData ? (
            <p className="t-body-medium text-on-surface-variant text-center py-10">{t('stats.noData')}</p>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6 lg:items-start">
              {/* 1. Phân bổ cảm xúc theo % */}
              <ChartCard title={`${t('stats.share')} (${label})`} footer={<LegendList items={distribution} />}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodPie}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius="62%"
                      label={pieLabel}
                      labelLine={{ stroke: c.line }}
                      stroke={c.surface}
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {moodPie.map((d) => (<Cell key={d.key} fill={d.color} />))}
                    </Pie>
                    <Tooltip {...tooltipProps} formatter={pieTooltip(moodTotal)} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* 2. Phân bổ hoạt động theo % */}
              <ChartCard title={`${t('stats.activitiesShare')} (${label})`} footer={<LegendList items={activityPie} />}>
                {activityPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityPie}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius="62%"
                        label={pieLabel}
                        labelLine={{ stroke: c.line }}
                        stroke={c.surface}
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {activityPie.map((d) => (<Cell key={d.id} fill={d.color} />))}
                      </Pie>
                      <Tooltip {...tooltipProps} formatter={pieTooltip(activityTotal)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="t-body-medium text-on-surface-variant text-center h-full flex items-center justify-center">{t('stats.noData')}</p>
                )}
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChartCard({ title, children, footer }) {
  return (
    <section className="mb-8 lg:mb-0 min-w-0">
      <p className="t-title-medium mb-2 px-1">{title}</p>
      <div className="w-full h-80 md:h-96 card-filled p-2">{children}</div>
      {footer}
    </section>
  )
}

// Chú thích dạng thanh tiến độ: emoji + tên + số lần + %, thanh tô theo màu của lát tròn.
function LegendList({ items, color }) {
  const total = items.reduce((a, i) => a + i.count, 0) || 1
  return (
    <ul className="card-filled mt-3 p-4 space-y-3.5">
      {items.map((it) => {
        const pct = (it.count / total) * 100
        const barColor = it.color || color
        return (
          <li key={it.key || it.id} className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: barColor }} />
              <span className="text-base leading-none shrink-0">{it.emoji}</span>
              <span className="t-body-medium flex-1 min-w-0 truncate">{it.label}</span>
              <span className="t-body-small text-on-surface-variant shrink-0 tabular-nums">{it.count}</span>
              <span className="t-label-large shrink-0 w-11 text-right tabular-nums">{Math.round(pct)}%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(128,128,128,.22)' }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={it.label}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: barColor,
                  transition: 'width .5s cubic-bezier(.2,0,0,1)',
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function StatRow({ icon: Icon, label, value, emoji, color }) {
  return (
    <div className="card-filled px-4 py-3 flex items-center gap-4 min-w-0">
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl" style={{ background: color + '40', color }}>
        {emoji || <Icon size={24} />}
      </span>
      <p className="t-body-large text-on-surface-variant flex-1 min-w-0 truncate">{label}</p>
      <p className="t-title-large leading-none shrink-0">{value}</p>
    </div>
  )
}