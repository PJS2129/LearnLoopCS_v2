import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExamTimerState } from './types'

export function useExamTimer(
  individualEndAt: unknown,
  onExpire?: () => void,
): ExamTimerState {
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const calculateRemaining = useCallback((): number => {
    if (!individualEndAt) return 0
    let targetMs = 0
    if (typeof (individualEndAt as { toDate?: () => Date }).toDate === 'function') {
      targetMs = (individualEndAt as { toDate: () => Date }).toDate().getTime()
    } else if (individualEndAt instanceof Date) {
      targetMs = individualEndAt.getTime()
    } else if (typeof individualEndAt === 'number') {
      targetMs = individualEndAt
    } else if (typeof individualEndAt === 'string') {
      const t = new Date(individualEndAt).getTime()
      targetMs = isNaN(t) ? 0 : t
    } else if (
      individualEndAt &&
      typeof individualEndAt === 'object' &&
      'seconds' in individualEndAt
    ) {
      targetMs = (individualEndAt as { seconds: number }).seconds * 1000
    }

    if (targetMs <= 0) return 0
    const now = Date.now()
    const diffSec = Math.floor((targetMs - now) / 1000)
    return Math.max(0, diffSec)
  }, [individualEndAt])

  const [remainingSec, setRemainingSec] = useState<number>(calculateRemaining)

  useEffect(() => {
    const current = calculateRemaining()
    if (current <= 0) {
      // 마운트 시점에 이미 지난 시각인 경우 즉시 자동 제출을 호출하지 않고 만료 상태만 유지
      setRemainingSec(0)
      return
    }

    setRemainingSec(current)

    const interval = setInterval(() => {
      const rem = calculateRemaining()
      setRemainingSec(rem)
      if (rem <= 0) {
        clearInterval(interval)
        onExpireRef.current?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateRemaining])

  const minutes = Math.floor(remainingSec / 60)
  const seconds = remainingSec % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return {
    totalSeconds: remainingSec,
    minutes,
    seconds,
    formattedTime,
    isWarning5Min: remainingSec <= 300 && remainingSec > 60,
    isWarning1Min: remainingSec <= 60 && remainingSec > 0,
    isExpired: remainingSec === 0,
  }
}
