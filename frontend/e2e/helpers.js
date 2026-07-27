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
