import { test, expect } from '@playwright/test'
import { selectTerminal } from './helpers'

test.describe('端末選択', () => {
  test('複数端末を選択できる', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await selectTerminal(page, '10.0.0.2')

    await expect(
      page.getByRole('button', { name: '10.0.0.1 他1件' })
    ).toBeVisible()
  })

  test('枠外をクリックするとドロップダウンが閉じる', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: '端末を選択してください' }).click()
    await expect(page.getByRole('group', { name: '端末候補' })).toBeVisible()

    await page.locator('body').click({ position: { x: 10, y: 400 } })

    await expect(page.getByRole('group', { name: '端末候補' })).not.toBeVisible()
  })

  test('選択した端末がリロード後も復元される', async ({ page }) => {
    await page.goto('/')

    await selectTerminal(page, '10.0.0.1')
    await page.reload()

    await expect(page.getByRole('button', { name: '10.0.0.1' })).toBeVisible()
    await expect(page.getByRole('button', { name: '検索', exact: true })).toBeEnabled()
  })
})
