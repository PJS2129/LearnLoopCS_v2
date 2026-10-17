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
      targetMs = new Date(individualEndAt).getTime()
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
      onExpireRef.current?.()
      return
    }

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
