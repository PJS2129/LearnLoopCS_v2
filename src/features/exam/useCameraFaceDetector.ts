import { useEffect, useRef, useState, useCallback } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { recordProctorEvent } from './proctorService'

export type CameraStatus =
  | 'idle'
  | 'initializing'
  | 'normal'
  | 'face_out'
  | 'multiple_faces'
  | 'disconnected'
  | 'disabled'

interface UseCameraFaceDetectorOptions {
  examId: string
  uid: string
  stream: MediaStream | null
  enabled?: boolean
  skipRecord?: boolean
}

const MEDIAPIPE_VERSION = '1.1.1'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

export function useCameraFaceDetector({
  examId,
  uid,
  stream,
  enabled = true,
  skipRecord = false,
}: UseCameraFaceDetectorOptions) {
  // 실제 활성 스트림 관리 (외부 전달 스트림 또는 재연결 스트림)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(stream)
  const [status, setStatus] = useState<CameraStatus>(enabled ? 'initializing' : 'disabled')
  const [faceCount, setFaceCount] = useState<number>(0)

  // 안전 기록 래퍼: 미리보기 모드(skipRecord: true)일 때는 Firestore에 기록하지 않음
  const safeRecord = useCallback(
    (params: Parameters<typeof recordProctorEvent>[0]) => {
      if (skipRecord) return
      recordProctorEvent(params).catch((e) =>
        console.warn('[useCameraFaceDetector] 기록 실패:', e),
      )
    },
    [skipRecord],
  )

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<FaceDetector | null>(null)
  const isDestroyedRef = useRef(false)

  // 판정 카운터 및 진행 중인 이탈 상태
  const initialFaceAcquiredRef = useRef(false)
  const initWaitSecRef = useRef(0)
  const zeroFaceConsecutiveSecRef = useRef(0)
  const multiFaceConsecutiveSecRef = useRef(0)
  const multiFaceReportedRef = useRef(false)
  const pendingFaceOutRef = useRef<{ startPerf: number; startIso: string } | null>(null)
  const cameraStoppedRef = useRef(false)

  // 1. 스트림 활성화 및 유지 (React StrictMode 및 트랙 종료 자동 복구)
  useEffect(() => {
    if (!enabled) {
      setStatus('disabled')
      setActiveStream(null)
      return
    }

    // 전달받은 스트림의 트랙이 살아있는지 확인
    const isStreamAlive =
      stream &&
      stream.active &&
      stream.getVideoTracks().some((t) => t.readyState === 'live')

    if (isStreamAlive) {
      cameraStoppedRef.current = false
      setActiveStream(stream)
    } else if (!cameraStoppedRef.current && navigator.mediaDevices?.getUserMedia) {
      // 전달된 스트림이 없거나 이미 종료된 경우(StrictMode 재마운트 등) 카메라 스트림 재취득
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 15 } },
          audio: false,
        })
        .then((newStream) => {
          if (!isDestroyedRef.current && !cameraStoppedRef.current) {
            setActiveStream(newStream)
          } else {
            newStream.getTracks().forEach((t) => t.stop())
          }
        })
        .catch((err) => {
          console.warn('[useCameraFaceDetector] 카메라 스트림 연결 실패:', err)
          setStatus('disabled')
        })
    }
  }, [stream, enabled])

  // 카메라 스트림 완전 종료 함수 (제출 완료 또는 시험 시간 만료 시 명시적으로만 호출)
  const stopCamera = useCallback(() => {
    if (cameraStoppedRef.current) return
    cameraStoppedRef.current = true

    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn('[useCameraFaceDetector] 트랙 종료 오류:', e)
        }
      })
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [activeStream])

  // 진행 중인 얼굴 미감지 이탈 마감 함수 (제출/종료 시 호출)
  const flushPendingFaceOut = useCallback(
    (reason = '제출 시점 마감') => {
      if (!pendingFaceOutRef.current) return

      const { startPerf, startIso } = pendingFaceOutRef.current
      const endPerf = performance.now()
      const endIso = new Date().toISOString()
      const durationSeconds = Math.max(5, Math.round((endPerf - startPerf) / 1000))

      pendingFaceOutRef.current = null

      safeRecord({
        examId,
        uid,
        type: 'face_out',
        startAt: startIso,
        endAt: endIso,
        durationSeconds,
        detail: `얼굴 화면 이탈 (${durationSeconds}초, ${reason})`,
        cameraUsed: true,
      })
    },
    [examId, uid, safeRecord],
  )

  // 2. 비디오 엘리먼트 연결 및 트랙 중단 감시
  useEffect(() => {
    if (!activeStream || !enabled) {
      return
    }

    const videoEl = videoRef.current
    if (videoEl && videoEl.srcObject !== activeStream) {
      videoEl.srcObject = activeStream
      videoEl.play().catch((err) => {
        console.warn('[useCameraFaceDetector] 비디오 재생 실패:', err)
      })
    }

    // 외장 카메라 분리 등으로 인한 트랙 중단 감지
    const handleTrackEnded = () => {
      // 명시적 종료(제출)가 아닌 외부적 요인으로 중단된 경우만 기록
      if (cameraStoppedRef.current) return

      console.warn('[useCameraFaceDetector] 카메라 스트림 트랙이 중단되었습니다.')
      setStatus('disconnected')
      flushPendingFaceOut('카메라 장치 중단')

      safeRecord({
        examId,
        uid,
        type: 'face_out',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        durationSeconds: 0,
        detail: '카메라 연결 중단 (장치 분리 또는 타 앱 점유)',
        cameraUsed: false,
      })
    }

    const tracks = activeStream.getVideoTracks()
    tracks.forEach((track) => track.addEventListener('ended', handleTrackEnded))

    return () => {
      tracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded))
    }
  }, [activeStream, enabled, examId, uid, flushPendingFaceOut])

  // 3. MediaPipe FaceDetector 초기화 및 1초 주기 감지
  useEffect(() => {
    if (!activeStream || !enabled) return
    isDestroyedRef.current = false

    let intervalId: number | null = null

    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        if (isDestroyedRef.current) return

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        })

        if (isDestroyedRef.current) {
          detector.close()
          return
        }

        detectorRef.current = detector

        // 1초마다 비디오 프레임 검사 루프
        intervalId = window.setInterval(() => {
          if (isDestroyedRef.current || !videoRef.current || !detectorRef.current) return
          const video = videoRef.current

          // 비디오 재생이 멈춰있다면 다시 재생 시도
          if (video.paused && !cameraStoppedRef.current) {
            video.play().catch(() => {})
          }

          // 비디오 프레임이 준비되지 않은 경우 대기
          if (video.readyState < 2 || video.videoWidth === 0 || video.paused) return

          try {
            const nowPerf = performance.now()
            const result = detectorRef.current.detectForVideo(video, nowPerf)
            const count = result.detections.length
            setFaceCount(count)

            // [1] 최초 얼굴 인식 대기 단계 (상한 5초)
            if (!initialFaceAcquiredRef.current) {
              if (count >= 1) {
                // 최초 1회 정상 인식 성공 -> 즉시 정상 모드로 전환
                initialFaceAcquiredRef.current = true
                setStatus('normal')
              } else {
                initWaitSecRef.current += 1
                if (initWaitSecRef.current >= 5) {
                  // 비디오가 정상 재생된 상태에서 5초 동안 얼굴이 한 번도 미인식된 경우 (카메라를 가린 경우)
                  initialFaceAcquiredRef.current = true
                  setStatus('face_out')
                  pendingFaceOutRef.current = {
                    startPerf: nowPerf,
                    startIso: new Date().toISOString(),
                  }
                  safeRecord({
                    examId,
                    uid,
                    type: 'face_out',
                    startAt: new Date(Date.now() - 5000).toISOString(),
                    endAt: new Date().toISOString(),
                    durationSeconds: 5,
                    detail: '시험 시작 시 얼굴 미확인 (5초 초과)',
                    cameraUsed: true,
                    initialFaceUnverified: true,
                  })
                }
              }
              return
            }

            // [2] 최초 인식 완료 후 실시간 모니터링 단계
            if (count === 0) {
              // 1) 얼굴 0개 (이탈)
              zeroFaceConsecutiveSecRef.current += 1
              multiFaceConsecutiveSecRef.current = 0
              multiFaceReportedRef.current = false

              // 5초 이상 연속 미감지 시 이탈 상태로 진입
              if (zeroFaceConsecutiveSecRef.current >= 5) {
                setStatus('face_out')
                if (!pendingFaceOutRef.current) {
                  pendingFaceOutRef.current = {
                    startPerf: nowPerf - 5000,
                    startIso: new Date(Date.now() - 5000).toISOString(),
                  }
                }
              }
            } else if (count >= 2) {
              // 2) 얼굴 2개 이상 (다수인원)
              zeroFaceConsecutiveSecRef.current = 0
              multiFaceConsecutiveSecRef.current += 1

              // 2명 이상이 3초 이상 지속될 때만 1회 기록
              if (multiFaceConsecutiveSecRef.current >= 3) {
                setStatus('multiple_faces')
                if (!multiFaceReportedRef.current) {
                  multiFaceReportedRef.current = true
                  safeRecord({
                    examId,
                    uid,
                    type: 'multiple_faces',
                    startAt: new Date().toISOString(),
                    endAt: new Date().toISOString(),
                    durationSeconds: 0,
                    detail: `다수 인원 감지 (${count}명, 3초 이상 지속)`,
                    cameraUsed: true,
                  })
                }
              }
            } else {
              // 3) 얼굴 1개 (정상 응시)
              multiFaceConsecutiveSecRef.current = 0
              multiFaceReportedRef.current = false
              zeroFaceConsecutiveSecRef.current = 0

              // 미감지 이탈 진행 중이었다면 복귀 기록
              if (pendingFaceOutRef.current) {
                const durSec = Math.max(
                  5,
                  Math.round((nowPerf - pendingFaceOutRef.current.startPerf) / 1000),
                )
                const startIso = pendingFaceOutRef.current.startIso
                const endIso = new Date().toISOString()
                pendingFaceOutRef.current = null

                safeRecord({
                  examId,
                  uid,
                  type: 'face_out',
                  startAt: startIso,
                  endAt: endIso,
                  durationSeconds: durSec,
                  detail: `얼굴 화면 이탈 (${durSec}초)`,
                  cameraUsed: true,
                })
              }

              setStatus('normal')
            }
          } catch (err) {
            console.warn('[useCameraFaceDetector] 감지 프레임 처리 오류:', err)
          }
        }, 1000)
      } catch (err) {
        console.warn('[useCameraFaceDetector] MediaPipe 초기화 실패:', err)
        setStatus('disabled')
      }
    }

    initDetector()

    return () => {
      isDestroyedRef.current = true
      if (intervalId !== null) clearInterval(intervalId)
      if (detectorRef.current) {
        try {
          detectorRef.current.close()
        } catch {
          // ignore
        }
        detectorRef.current = null
      }
      // 주의: 컴포넌트 이펙트 재실행 시 웹캠 트랙을 닫지 않음 (제출/종료 시 stopCamera로만 닫음)
    }
  }, [activeStream, enabled, examId, uid, safeRecord])

  return {
    videoRef,
    activeStream,
    status,
    faceCount,
    stopCamera,
    flushPendingFaceOut,
  }
}
