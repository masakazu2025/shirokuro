import { test, expect } from '@playwright/test'
import { selectTerminal } from './helpers'

test.describe('範囲入力のバリデーション', () => {
  test.describe('日時範囲', () => {
    test('from > toのとき、エラー表示され検索ボタンが無効になる', async ({ page }) => {
      await page.goto('/')

      await selectTerminal(page, '10.0.0.1')
      await page.getByRole('button', { name: /詳細検索/ }).click()
      await page.getByLabel('日時範囲(開始)').fill('2026-07-20T00:00')
      await page.getByLabel('日時範囲(終了)').fill('2026-07-01T00:00')

      await expect(page.getByText('開始日時は終了日時より前にしてください')).toBeVisible()
      await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()
    })

    test('修正するとエラーが消え、検索ボタンが有効に戻る', async ({ page }) => {
      await page.goto('/')

      await selectTerminal(page, '10.0.0.1')
      await page.getByRole('button', { name: /詳細検索/ }).click()
      await page.getByLabel('日時範囲(開始)').fill('2026-07-20T00:00')
      await page.getByLabel('日時範囲(終了)').fill('2026-07-01T00:00')
      await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()

      await page.getByLabel('日時範囲(終了)').fill('2026-07-25T00:00')

      await expect(page.getByText('開始日時は終了日時より前にしてください')).not.toBeVisible()
      await expect(page.getByRole('button', { name: '検索', exact: true })).toBeEnabled()
    })

    test('修正後、実際にその範囲で検索できる', async ({ page }) => {
      await page.goto('/')

      await selectTerminal(page, '10.0.0.1')
      await page.getByRole('button', { name: /詳細検索/ }).click()
      await page.getByLabel('日時範囲(開始)').fill('2026-07-20T00:00')
      await page.getByLabel('日時範囲(終了)').fill('2026-07-01T00:00')
      // 無効な状態(開始>終了)を、デモデータの日付(07-14)を含む正しい範囲に直す
      await page.getByLabel('日時範囲(開始)').fill('2026-07-01T00:00')
      await page.getByLabel('日時範囲(終了)').fill('2026-07-20T23:59')

      await page.getByRole('button', { name: '検索', exact: true }).click()

      await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()
    })
  })

  test.describe('取引番号範囲', () => {
    test('from > toのとき、エラー表示され検索ボタンが無効になる', async ({ page }) => {
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
})
