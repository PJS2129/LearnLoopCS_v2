import React, { useEffect } from 'react'
import type { CameraStatus } from './useCameraFaceDetector'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  faceCount: number
  stream?: MediaStream | null
  onToggleCamera?: () => void
}

export default function ExamCameraPreview({
  videoRef,
  status,
  faceCount,
  stream,
  onToggleCamera,
}: Props) {
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [videoRef, stream, status])
  if (status === 'disabled') {
    return (
      <div className="exam-camera-box is-disabled">
        <div className="camera-badge-pill is-disabled">카메라 미사용</div>
        <div className="camera-disabled-desc">응시 보조 카메라가 꺼져 있습니다</div>
        {onToggleCamera && (
          <button
            type="button"
            className="camera-box-action-btn"
            onClick={onToggleCamera}
          >
            📷 카메라 테스트 켜기
          </button>
        )}
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'normal':
        return <span className="camera-badge-pill is-normal">● 정상 응시 중</span>
      case 'face_out':
        return <span className="camera-badge-pill is-warning">▲ 화면 이탈 (얼굴 미감지)</span>
      case 'multiple_faces':
        return <span className="camera-badge-pill is-danger">■ 다수 인원 감지 ({faceCount}명)</span>
      case 'disconnected':
        return <span className="camera-badge-pill is-danger">✕ 카메라 연결 중단</span>
      case 'initializing':
        return <span className="camera-badge-pill is-init">⏳ 카메라 준비 중...</span>
      default:
        return null
    }
  }

  return (
    <div className={`exam-camera-box status-${status}`}>
      <div className="exam-camera-video-wrap">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="exam-camera-video"
        />
      </div>
      {/* 상태 배지는 비디오 화면 아래에 별도 배치 */}
      <div className="exam-camera-status-bar">
        {getStatusBadge()}
        {onToggleCamera && (
          <button
            type="button"
            className="camera-box-mini-off-btn"
            onClick={onToggleCamera}
            title="카메라 테스트 끄기"
          >
            끄기
          </button>
        )}
      </div>
    </div>
  )
}
