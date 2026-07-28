import { test, expect } from '@playwright/test'
import { colorStringToRgb, contrastRatio } from './helpers'

// WCAG AAの通常テキスト基準(4.5:1)を、視認性の下限の目安として使う
const MIN_CONTRAST = 4.5

async function getRgb(locator) {
  const colorString = await locator.evaluate((el) => getComputedStyle(el).color)
  return locator.page().evaluate(colorStringToRgb, colorString)
}

async function getBgRgb(page) {
  const colorString = await page
    .locator('.min-h-screen')
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  return page.evaluate(colorStringToRgb, colorString)
}

test.describe('テーマ切り替え', () => {
  test('ライト・ダークどちらでも、見出し・本文のテキストが背景に対して十分なコントラストを保つ', async ({
    page,
  }) => {
    await page.goto('/')

    const heading = page.getByRole('heading', { name: 'Shirokuro' })
    const subtitle = page.getByText('取引データ閲覧')

    const lightBg = await getBgRgb(page)
    expect(contrastRatio(await getRgb(heading), lightBg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    expect(contrastRatio(await getRgb(subtitle), lightBg)).toBeGreaterThanOrEqual(MIN_CONTRAST)

    await page.getByRole('button', { name: /ダークモードに切り替え/ }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    const darkBg = await getBgRgb(page)
    expect(contrastRatio(await getRgb(heading), darkBg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    expect(contrastRatio(await getRgb(subtitle), darkBg)).toBeGreaterThanOrEqual(MIN_CONTRAST)

    // ダーク切り替えで背景色自体も変わっていること(明るい背景のまま文字色だけ薄くなる誤検知を防ぐ)
    expect(darkBg).not.toEqual(lightBg)
  })

  test('リロード後もテーマ設定が復元される', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /ダークモードに切り替え/ }).click()
    await page.reload()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: /ライトモードに切り替え/ })).toBeVisible()
  })
})
