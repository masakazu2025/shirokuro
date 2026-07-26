import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useTheme from './useTheme'

function mockMatchMedia(prefersDark) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('useTheme', () => {
  it('localStorageに保存がなければ、システムの設定(ダーク)に従う', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('localStorageに保存がなければ、システムの設定(ライト)に従う', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('localStorageに保存があれば、システム設定より優先する', () => {
    mockMatchMedia(true) // システムはダークだが
    localStorage.setItem('shirokuro:theme', 'light') // 保存はライト

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('toggleThemeでテーマが切り替わり、localStorageに保存される', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('shirokuro:theme')).toBe('dark')
  })

  it('テーマがdarkのとき、<html>にdarkクラスが付与される', () => {
    mockMatchMedia(true)

    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('テーマがlightのとき、<html>にdarkクラスが付与されない', () => {
    mockMatchMedia(false)

    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
