interface Props {
  title: string
  description?: string
}

// 1단계에서는 모든 탭 내용을 "준비 중" 카드로만 보여 준다.
export default function TabPlaceholder({ title, description }: Props) {
  return (
    <section className="card shell-empty" aria-live="polite">
      <p className="shell-empty-title">{title}</p>
      <p className="shell-empty-desc">{description ?? '준비 중이에요. 다음 단계에서 추가됩니다.'}</p>
    </section>
  )
}
