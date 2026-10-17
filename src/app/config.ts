// 시험·과목이 바뀌면 이 파일의 값만 바꾼다.
export const APP_CONFIG = {
  appName: 'LearnLoopCS',
  courseName: '컴퓨터공학개론',
  tagline: '배우고, 시험 보고, 다시 복습하는 학습 순환 플랫폼',
  // 분반 선택지. firestore.rules의 section 검증 목록도 함께 바꾼다.
  sections: ['A반', 'B반'],
} as const
