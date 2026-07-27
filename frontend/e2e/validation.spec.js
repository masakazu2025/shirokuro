import { test, expect } from '@playwright/test'
import { selectTerminal } from './helpers'

test.describe('範囲入力のバリデーション', () => {
  test('取引番号範囲でfrom > toのとき、エラー表示され検索ボタンが無効になる', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: /詳細検索/ }).click()
    await page.getByLabel('取引番号範囲(開始)').fill('20')
    await page.getByLabel('取引番号範囲(終了)').fill('10')

    await expect(page.getByText('開始番号は終了番号より前にしてください')).toBeVisible()
    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()
  })

  test('修正するとエラーが消え、検索ボタンが有効に戻る', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: /詳細検索/ }).click()
    await page.getByLabel('取引番号範囲(開始)').fill('20')
    await page.getByLabel('取引番号範囲(終了)').fill('10')
    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()

    await page.getByLabel('取引番号範囲(終了)').fill('30')

    await expect(page.getByText('開始番号は終了番号より前にしてください')).not.toBeVisible()
    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeEnabled()
  })
})
