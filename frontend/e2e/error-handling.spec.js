import { test, expect } from '@playwright/test'
import { selectTerminal } from './helpers'

test.describe('アイテム解析エラーのハンドリング', () => {
  test('商品レコード(CSV)の解析エラーがある取引を開くと、エラー(422)が表示される', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.getByRole('button', { name: '検索', exact: true }).click()
    await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()

    await page.getByText('取引 No.6').click()
    await page.getByRole('button', { name: '商品レコード' }).click()

    await expect(page.getByText(/エラー \(422\)/)).toBeVisible()
  })

  test('支払レコード(JSON)の構造エラーがある取引を開くと、エラー(422)が表示される', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.3')
    await page.getByRole('button', { name: '検索', exact: true }).click()
    await expect(page.getByText(/取引 No\.\d+/).first()).toBeVisible()

    await page.getByText('取引 No.15').click()
    await page.getByRole('button', { name: '支払レコード' }).click()

    await expect(page.getByText(/エラー \(422\)/)).toBeVisible()
  })
})
