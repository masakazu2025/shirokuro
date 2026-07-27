import { test, expect } from '@playwright/test'
import { DEMO_DATE, selectTerminal } from './helpers'

test.describe('クリアボタン', () => {
  test('全項目がリセットされ、詳細検索も閉じる', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: /詳細検索/ }).click()
    await page.getByLabel('取引番号範囲(開始)').fill('5')

    await page.getByRole('button', { name: 'クリア' }).click()

    await expect(page.getByRole('button', { name: '端末を選択してください' })).toBeVisible()
    await expect(page.getByLabel('日付')).toHaveValue(DEMO_DATE)
    await expect(page.getByRole('button', { name: /詳細検索/ })).toBeVisible()
    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()
  })
})
