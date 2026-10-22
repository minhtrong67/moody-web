import { getReportAccent } from './theme'

// Dựng DOM báo cáo rồi chụp lại bằng html2canvas (giữ nguyên font chữ vì được render dưới dạng ảnh).
// Dùng chung cho xuất PDF và xuất ảnh PNG. `i18n` = { t, locale } từ useI18n().
// Báo cáo gồm: 4 chỉ số + biểu đồ tròn cảm xúc (%) + biểu đồ tròn hoạt động (%), chú thích dạng progress bar.
const PAGE_W = 794 // ~A4 @ 96dpi
const PAGE_H = 1123
const PAGE_MARGIN_Y = 32

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

async function buildReport({ periodLabel, stats, distribution, activityPie = [], i18n }) {
  const { t, locale } = i18n
  const accent = getReportAccent()
  const { default: html2canvas } = await import('html2canvas-pro')

  const node = document.createElement('div')
  // QUAN TRỌNG: giữ phần tử ở toạ độ dương bình thường (0,0), KHÔNG dùng left âm,
  // transform, hay truyền x/y/scrollX/scrollY/windowWidth/windowHeight cho html2canvas —
  // mọi cách "mẹo" để dịch phần tử ra ngoài khung nhìn đều khiến thư viện này tính sai
  // vùng chụp. Cách ổn định duy nhất là để phần tử nằm đúng vị trí tự nhiên nhưng đẩy
  // xuống dưới z-index để người dùng không nhìn thấy nó trong lúc chụp.
  node.style.position = 'fixed'
  node.style.top = '0'
  node.style.left = '0'
  node.style.zIndex = '-9999'
  node.style.width = `${PAGE_W}px`
  node.style.boxSizing = 'border-box'
  node.style.padding = '0 40px'
  node.style.background = '#FFFFFF'
  node.style.color = '#1C1917'
  node.style.fontFamily = "'Inter Variable', Inter, 'Segoe UI', Arial, sans-serif"

  const h = (text) => `<div style="font-size:14px; font-weight:700; color:${accent}; margin-bottom:12px;">${esc(text)}</div>`
  // Mỗi khối (và từng dòng chú thích) mang data-blk để PDF ngắt trang giữa các khối, không cắt ngang nội dung.
  const block = (inner, mb = 28) => `<div data-blk style="margin-bottom:${mb}px;">${inner}</div>`

  const moodTotal = distribution.reduce((a, d) => a + d.count, 0) || 1
  const activityTotal = activityPie.reduce((a, d) => a + d.count, 0) || 1

  node.innerHTML =
    block(
      `<div style="border-bottom:3px solid ${accent}; padding-bottom:16px; padding-top:40px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-size:22px; font-weight:700; color:${accent};">${esc(t('report.title'))}</div>
          <div style="font-size:13px; color:#57534E; margin-top:4px;">${esc(periodLabel)}</div>
        </div>
        <div style="font-size:11px; color:#78716C;">${esc(t('report.exportedOn', { date: new Date().toLocaleDateString(locale) }))}</div>
      </div>`,
      24
    ) +
    block(
      `<div style="display:flex; gap:12px;">
        ${statCard(t('stats.avgMood'), stats.avg != null ? stats.avg.toFixed(2) + '/5' : '—')}
        ${statCard(t('report.checkinDays'), String(stats.checkinDays))}
        ${statCard(t('stats.streak'), t('report.days', { n: stats.streak }))}
        ${statCard(t('stats.topMood'), stats.topMood ? stats.topMood.emoji + ' ' + stats.topMood.label : '—')}
      </div>`
    ) +
    block(`${h(`${t('stats.share')} (${periodLabel})`)}${pieChart(distribution, moodTotal)}`, 8) +
    barList(distribution, moodTotal, accent) +
    (activityPie.length
      ? block(`${h(`${t('stats.activitiesShare')} (${periodLabel})`)}${pieChart(activityPie, activityTotal)}`, 8) +
      barList(activityPie, activityTotal, accent)
      : '') +
    block(
      `<div style="font-size:10px; color:#78716C; text-align:center; border-top:1px solid #E7E5E4; padding:12px 0 40px;">${esc(t('report.footer'))}</div>`,
      0
    )

  document.body.appendChild(node)
  try {
    const blockTops = [...node.querySelectorAll('[data-blk]')].map((el) => el.offsetTop)
    const totalHeight = node.offsetHeight
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF' })
    return { canvas, blockTops, totalHeight }
  } finally {
    document.body.removeChild(node)
  }
}

function fileSafeLabel(periodLabel) {
  return periodLabel.replace(/[\s/,→]+/g, '-')
}

// Chia thành các trang A4: mỗi trang tối đa PAGE_H - 2*margin, ngắt tại đầu khối gần nhất.
function paginate(blockTops, totalHeight) {
  const usable = PAGE_H - PAGE_MARGIN_Y * 2
  const pages = []
  let start = 0
  while (totalHeight - start > usable) {
    const candidates = blockTops.filter((y) => y > start && y - start <= usable)
    const cut = candidates.length ? candidates[candidates.length - 1] : start + usable
    pages.push([start, cut])
    start = cut
  }
  pages.push([start, totalHeight])
  return pages
}

export async function exportStatsPdf(args) {
  // Nạp thư viện nặng khi thật sự cần (bấm xuất) để trang Thống kê mở nhanh hơn.
  const [{ canvas, blockTops, totalHeight }, { default: jsPDF }] = await Promise.all([buildReport(args), import('jspdf')])
  const scale = canvas.width / PAGE_W
  const pdf = new jsPDF({ unit: 'px', format: [PAGE_W, PAGE_H], orientation: 'portrait', hotfixes: ['px_scaling'] })
  const pages = paginate(blockTops, totalHeight)
  pages.forEach(([from, to], i) => {
    const sliceH = Math.min(canvas.height, Math.round(to * scale)) - Math.round(from * scale)
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceH
    const ctx = slice.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, Math.round(from * scale), canvas.width, sliceH, 0, 0, canvas.width, sliceH)
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, PAGE_MARGIN_Y, PAGE_W, sliceH / scale)
  })
  pdf.save(`moody-report-${fileSafeLabel(args.periodLabel)}.pdf`)
}

export async function exportStatsImage(args) {
  const { canvas } = await buildReport(args)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moody-report-${fileSafeLabel(args.periodLabel)}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function statCard(label, value) {
  return `
    <div style="flex:1; border:1px solid #E7E5E4; border-radius:12px; padding:12px 14px;">
      <div style="font-size:11px; color:#57534E; margin-bottom:4px;">${esc(label)}</div>
      <div style="font-size:16px; font-weight:700; color:#1C1917;">${esc(value)}</div>
    </div>
  `
}

// Biểu đồ tròn SVG + nhãn emoji/% đặt quanh lát bằng HTML (html2canvas vẽ emoji trong HTML ổn định hơn trong SVG).
// Lát nhỏ hơn 3% chỉ hiện emoji để các nhãn không chồng nhau.
function pieChart(items, total) {
  const data = items.filter((d) => d.count > 0)
  if (!data.length) return ''
  const W = 460
  const H = 270
  const CX = W / 2
  const CY = H / 2
  const R = 88
  const LABEL_W = 64
  let angle = -Math.PI / 2

  const slices = []
  const labels = []
  for (const d of data) {
    const frac = d.count / total
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    if (frac >= 0.9999) {
      slices.push(`<circle cx="${CX}" cy="${CY}" r="${R}" fill="${d.color}" stroke="#FFFFFF" stroke-width="2" />`)
    } else {
      const [x0, y0] = [CX + R * Math.cos(a0), CY + R * Math.sin(a0)]
      const [x1, y1] = [CX + R * Math.cos(a1), CY + R * Math.sin(a1)]
      slices.push(
        `<path d="M${CX} ${CY} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${d.color}" stroke="#FFFFFF" stroke-width="2" />`
      )
    }
    const mid = (a0 + a1) / 2
    const lx = CX + (R + 22) * Math.cos(mid)
    const ly = CY + (R + 22) * Math.sin(mid)
    const right = Math.cos(mid) >= 0
    const text = frac < 0.03 ? d.emoji : `${d.emoji} ${Math.round(frac * 100)}%`
    labels.push(
      `<div style="position:absolute; left:${(right ? lx : lx - LABEL_W).toFixed(1)}px; top:${(ly - 9).toFixed(1)}px; width:${LABEL_W}px; height:18px; line-height:18px; font-size:12px; color:#1C1917; white-space:nowrap; text-align:${right ? 'left' : 'right'};">${esc(text)}</div>`
    )
  }

  return `
    <div style="position:relative; width:${W}px; height:${H}px; margin:0 auto;">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute; left:0; top:0;">${slices.join('')}</svg>
      ${labels.join('')}
    </div>`
}

// Chú thích dạng progress bar: chấm màu + emoji + tên + số lần + %, thanh tô theo màu lát tròn.
// Mỗi dòng cao cố định (ROW_H), mọi phần tử đặt tuyệt đối với line-height = ROW_H để html2canvas
// không tính lệch vị trí theo chiều dọc. Mỗi dòng là một khối riêng (data-blk) để ngắt trang gọn.
function barList(items, total, fallback) {
  const ROW_H = 24
  return items
    .map((d, i) => {
      const pct = (d.count / total) * 100
      const color = d.color || fallback
      const last = i === items.length - 1
      return `<div data-blk style="margin-bottom:${last ? 28 : 12}px;">
        <div style="position:relative; height:${ROW_H}px; margin-bottom:4px;">
          <span style="position:absolute; left:0; top:${(ROW_H - 10) / 2}px; width:10px; height:10px; border-radius:50%; background:${color};"></span>
          <span style="position:absolute; left:20px; top:0; width:24px; height:${ROW_H}px; line-height:${ROW_H}px; font-size:15px; text-align:center;">${esc(d.emoji)}</span>
          <span style="position:absolute; left:52px; right:90px; top:0; height:${ROW_H}px; line-height:${ROW_H}px; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(d.label)}</span>
          <span style="position:absolute; right:48px; top:0; height:${ROW_H}px; line-height:${ROW_H}px; font-size:12px; color:#78716C; text-align:right;">${d.count}</span>
          <span style="position:absolute; right:0; top:0; width:40px; height:${ROW_H}px; line-height:${ROW_H}px; font-size:12px; font-weight:700; text-align:right;">${Math.round(pct)}%</span>
        </div>
        <div style="height:8px; border-radius:4px; background:#F5F5F4; overflow:hidden;">
          <div style="height:8px; width:${pct.toFixed(2)}%; border-radius:4px; background:${color};"></div>
        </div>
      </div>`
    })
    .join('')
}