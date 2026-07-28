export async function selectTerminal(page, ip) {
  const group = page.getByRole('group', { name: '端末候補' })
  const isOpen = await group.isVisible().catch(() => false)
  if (!isOpen) {
    await page.getByRole('button', { name: /端末を選択してください|他\d+件|^10\./ }).click()
  }
  await group.getByText(ip, { exact: true }).click()
  await page.keyboard.press('Escape')
}

export function todayDateString() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const DEMO_DATE = '2026-07-14'

function relativeLuminance([r, g, b]) {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

// WCAG 2.0のコントラスト比((L1+0.05)/(L2+0.05)、L1が明るい方)を、[r, g, b]の2配列から計算する
export function contrastRatio([ar, ag, ab], [br, bg, bb]) {
  const la = relativeLuminance([ar, ag, ab])
  const lb = relativeLuminance([br, bg, bb])
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

// getComputedStyleの戻り値はTailwind v4のoklch()等、rgb()以外の形式のこともあるため、
// canvasに描画して確実にsRGBの[r, g, b]へ変換する(ブラウザのpage.evaluate内で実行すること)
export function colorStringToRgb(colorString) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = colorString
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}
