import { useEffect, useRef, useState } from 'react'
import { fetchServerTime } from './examService'
import type { ExamTimerState } from './types'

function parseTargetMs(endAt: unknown): number {
  if (!endAt) return 0
  if (typeof (endAt as { toDate?: () => Date }).toDate === 'function') {
    return (endAt as { toDate: () => Date }).toDate().getTime()
  } else if (endAt instanceof Date) {
    return endAt.getTime()
  } else if (typeof endAt === 'number') {
    return endAt
  } else if (typeof endAt === 'string') {
    const t = new Date(endAt).getTime()
    return isNaN(t) ? 0 : t
  } else if (
    endAt &&
    typeof endAt === 'object' &&
    'seconds' in endAt
  ) {
    return (endAt as { seconds: number }).seconds * 1000
  }
  return 0
}

export function useExamTimer(
  individualEndAt: unknown,
  onExpire?: () => void,
): ExamTimerState {
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const targetMs = parseTargetMs(individualEndAt)

  // 로컬 시계 기준 초기값 (즉시 렌더링용)
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (targetMs <= 0) return 0
    return Math.max(0, Math.floor((targetMs - Date.now()) / 1000))
  })

  useEffect(() => {
    if (targetMs <= 0) {
      setRemainingSec(0)
      return
    }

    // performance.now() 기준 시점 및 기준 잔여 초
    let basePerfMs = performance.now()
    let baseRemainingSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000))
    let hasExpired = baseRemainingSec <= 0
    let retryCount = 0
    let retryIntervalId: ReturnType<typeof setInterval> | null = null

    // 1초 카운트다운 인터벌 (performance.now() 경과 시간 기반으로 학생 PC 시계 조작 원천 방어)
    const countdownInterval = setInterval(() => {
      const elapsedSec = Math.floor((performance.now() - basePerfMs) / 1000)
      const currentRem = Math.max(0, baseRemainingSec - elapsedSec)
      setRemainingSec(currentRem)

      if (currentRem <= 0 && !hasExpired) {
        hasExpired = true
        clearInterval(countdownInterval)
        if (retryIntervalId) clearInterval(retryIntervalId)
        onExpireRef.current?.()
      }
    }, 1000)

    // 서버 시각 동기화 함수
    const syncWithServer = async (): Promise<boolean> => {
      const serverDate = await fetchServerTime()
      if (serverDate && !hasExpired) {
        const serverNowMs = serverDate.getTime()
        const syncRemSec = Math.max(0, Math.floor((targetMs - serverNowMs) / 1000))
        basePerfMs = performance.now()
        baseRemainingSec = syncRemSec
        setRemainingSec(syncRemSec)

        if (syncRemSec <= 0 && !hasExpired) {
          hasExpired = true
          clearInterval(countdownInterval)
          if (retryIntervalId) clearInterval(retryIntervalId)
          onExpireRef.current?.()
        }
        return true
      }
      return false
    }

    // 마운트 시 1회 서버 시각 조회
    syncWithServer().then((success) => {
      if (!success && !hasExpired) {
        // [4-3단계] 서버 시각 조회 실패 시 30초 간격으로 최대 3회 재시도하여 서버 기준으로 재동기화
        retryIntervalId = setInterval(async () => {
          retryCount++
          const ok = await syncWithServer()
          if (ok || retryCount >= 3) {
            if (retryIntervalId) clearInterval(retryIntervalId)
          }
        }, 30000)
      }
    })

    return () => {
      clearInterval(countdownInterval)
      if (retryIntervalId) clearInterval(retryIntervalId)
    }
  }, [targetMs])

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
