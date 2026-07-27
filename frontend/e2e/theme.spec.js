import { test, expect } from '@playwright/test'

test.describe('テーマ切り替え', () => {
  test('切り替えボタンでdarkクラスが付き、テキストが視認できる色になる', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    await page.getByRole('button', { name: /ダークモードに切り替え/ }).click()

    await expect(html).toHaveClass(/dark/)
    const h1Color = await page.locator('h1').evaluate((el) => getComputedStyle(el).color)
    // ダークモードでは明るい色(黒に近い低輝度ではない)になっているはず
    const [r, g, b] = h1Color.match(/\d+/g).map(Number)
    expect(r + g + b).toBeGreaterThan(300)
  })

  test('リロード後もテーマ設定が復元される', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /ダークモードに切り替え/ }).click()
    await page.reload()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: /ライトモードに切り替え/ })).toBeVisible()
  })
})
