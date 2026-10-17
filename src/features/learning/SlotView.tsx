import { useEffect, useRef, useState } from 'react'
import type { ConceptQuizContent, LearningTab } from '../../lib/types'
import { parseActivitySignal, recordActivity } from './activity'
import { useAuth } from '../../lib/auth'
import TabPlaceholder from './TabPlaceholder'
import ConceptQuizViewer from './ConceptQuizViewer'
import './learning.css'

interface Props {
  tab: LearningTab
}

type LoadState = 'checking' | 'ready' | 'missing'

// 학습 탭 슬롯: 유형에 따라 콘텐츠를 보여 준다. 과목별 내용은 코드에 없고 learning-tabs.json과 content/ 파일에 있다.
export default function SlotView({ tab }: Props) {
  const { user } = useAuth()
  const isSimulator = tab.type === 'simulator'
  const isCards = tab.type === 'cards'
  const [loadState, setLoadState] = useState<LoadState>(
    isSimulator || isCards ? 'checking' : 'missing',
  )
  const [cardsContent, setCardsContent] = useState<ConceptQuizContent | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const url = `${import.meta.env.BASE_URL}${tab.src}`

  // 파일이 실제로 있는지 확인한다. 개발 서버는 없는 파일에도 index.html을 돌려주므로 본문도 확인한다.
  useEffect(() => {
    if (!isSimulator && !isCards) return
    let cancelled = false

    if (isSimulator) {
      fetch(url)
        .then(async (r) => {
          if (!r.ok) return false
          const type = r.headers.get('content-type') ?? ''
          if (!type.includes('text/html')) return false
          const text = await r.text()
          return !text.includes('id="root"')
        })
        .then((ok) => {
          if (!cancelled) setLoadState(ok ? 'ready' : 'missing')
        })
        .catch(() => {
          if (!cancelled) setLoadState('missing')
        })
    } else {
      fetch(url)
        .then(async (r) => {
          if (!r.ok) return null
          const data = (await r.json()) as ConceptQuizContent
          if (!data || !Array.isArray(data.cards) || !Array.isArray(data.quizzes)) {
            return null
          }
          return data
        })
        .then((data) => {
          if (!cancelled) {
            if (data) {
              setCardsContent(data)
              setLoadState('ready')
            } else {
              setLoadState('missing')
            }
          }
        })
        .catch(() => {
          if (!cancelled) setLoadState('missing')
        })
    }

    return () => {
      cancelled = true
    }
  }, [isSimulator, isCards, url])


  // 활동 신호 수신. 샌드박스 iframe의 origin은 "null"이라 origin 대신 보낸 창(source)이 현재 iframe인지 확인한다.
  useEffect(() => {
    if (!isSimulator) return
    const onMessage = (event: MessageEvent) => {
      const frame = frameRef.current
      if (!frame || event.source !== frame.contentWindow) return
      const signal = parseActivitySignal(event.data, tab.id)
      if (signal) recordActivity(signal, user?.uid, tab.name)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isSimulator, tab.id, tab.name, user?.uid])

  if (loadState === 'checking') {
    return (
      <section className="card shell-empty" aria-live="polite">
        <p className="shell-empty-desc">불러오는 중이에요…</p>
      </section>
    )
  }

  if (loadState === 'missing') {
    return <TabPlaceholder title={tab.name} description={`${tab.area} 학습 콘텐츠를 준비 중이에요.`} />
  }

  if (isCards && cardsContent) {
    return <ConceptQuizViewer tab={tab} content={cardsContent} />
  }

  return (
    <section className="card slot-frame-card" aria-label={`${tab.name} 시뮬레이터`}>
      <iframe
        ref={frameRef}
        id={`slot-frame-${tab.id}`}
        className="slot-frame"
        title={`${tab.name} 시뮬레이터`}
        src={url}
        // allow-same-origin을 주지 않아 콘텐츠가 플랫폼의 로그인 정보·저장소에 접근할 수 없다.
        sandbox="allow-scripts"
        loading="lazy"
      />
    </section>
  )
}

