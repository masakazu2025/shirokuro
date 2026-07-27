import { test, expect } from '@playwright/test'
import { DEMO_DATE, todayDateString } from './helpers'

test.describe('当日チェック・日付のデフォルト', () => {
  test('初回訪問時、当日OFF・日付はデモデータの固定日付', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('checkbox', { name: '当日' })).not.toBeChecked()
    await expect(page.getByLabel('日付')).toHaveValue(DEMO_DATE)
    await expect(page.getByLabel('日付')).toBeEnabled()
  })

  test('当日ONにすると日付が今日になり、入力欄がグレーアウトする', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('checkbox', { name: '当日' }).click()

    await expect(page.getByLabel('日付')).toHaveValue(todayDateString())
    await expect(page.getByLabel('日付')).toBeDisabled()
  })

  test('リロード後、当日ON状態は復元され、日付は現在日付に再計算される', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('checkbox', { name: '当日' }).click()

    await page.reload()

    await expect(page.getByRole('checkbox', { name: '当日' })).toBeChecked()
    await expect(page.getByLabel('日付')).toHaveValue(todayDateString())
  })

  test('当日OFF+任意の日付を保存していた場合、リロード後そのまま復元される', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('日付').fill('2026-01-01')
    await page.reload()

    await expect(page.getByRole('checkbox', { name: '当日' })).not.toBeChecked()
    await expect(page.getByLabel('日付')).toHaveValue('2026-01-01')
  })
})
