import { test, expect } from '@playwright/test'
import { selectTerminal } from './helpers'

test.describe('検索の基本フロー', () => {
  test('端末未選択では検索ボタンが無効', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeDisabled()
  })

  test('端末選択→検索→一覧が表示される', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: '検索', exact: true }).click()

    await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()
  })

  test('一覧から取引を選ぶと詳細が表示される', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: '検索', exact: true }).click()
    await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()

    // 検索直後は先頭の取引が自動選択される
    await expect(page.getByRole('heading', { name: /^取引: / })).toBeVisible()
    await expect(page.getByRole('button', { name: 'ジャーナル' })).toBeVisible()
  })

  test('支払レコードの決済手段タブをクリックすると、表示内容が切り替わる', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: '検索', exact: true }).click()
    await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()

    // 取引No.5は複数の決済手段(コード決済・現金)を持つ
    await page.getByText('取引 No.5').click()
    await page.getByRole('button', { name: '支払レコード' }).click()

    await expect(page.getByRole('button', { name: 'コード決済' })).toBeVisible()
    await expect(page.getByRole('button', { name: '現金' })).toBeVisible()
    await expect(page.getByText('楽天Pay')).toBeVisible()

    await page.getByRole('button', { name: '現金' }).click()

    await expect(page.getByText('楽天Pay')).not.toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })
})
