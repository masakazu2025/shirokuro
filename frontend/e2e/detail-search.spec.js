import { test, expect } from '@playwright/test'
import { DEMO_DATE } from './helpers'

test.describe('詳細検索/簡易検索の切り替え', () => {
  test('「詳細検索」を押すと「簡易検索」に文言・見た目が変わる', async ({ page }) => {
    await page.goto('/')

    const button = page.getByRole('button', { name: /詳細検索/ })
    await expect(button).not.toHaveClass(/border-blue-500/)

    await button.click()

    const toggled = page.getByRole('button', { name: /簡易検索/ })
    await expect(toggled).toBeVisible()
    await expect(toggled).toHaveClass(/border-blue-500/)
  })

  test('開くと既存の日付から日時範囲(00:00〜23:59)が自動セットされる', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /詳細検索/ }).click()

    await expect(page.getByLabel('日時範囲(開始)')).toHaveValue(`${DEMO_DATE}T00:00`)
    await expect(page.getByLabel('日時範囲(終了)')).toHaveValue(`${DEMO_DATE}T23:59`)
  })

  test('📌固定を押すと、リロード後も詳細検索が開いた状態で復元される', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /詳細検索/ }).click()
    await page.getByRole('button', { name: /固定/ }).click()

    await page.reload()

    await expect(page.getByRole('button', { name: /簡易検索/ })).toBeVisible()
    await expect(page.getByLabel('日時範囲(開始)')).toBeVisible()
  })
})
