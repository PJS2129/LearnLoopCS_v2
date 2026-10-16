# LearnLoopCS 프롬프트 기록

## 0단계. 프로젝트 기본 구조 (2026-10-16)

### 보낸 프롬프트
```
@AGENTS.md
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-1-shell.md 파일도 먼저 읽고 참고해 줘.

AGENTS.md를 기준으로 [0단계: 프로젝트 기본 구조]만 진행해 줘.

# 현재 상태
- Vite + React + TypeScript 프로젝트가 생성되어 있고, GitHub 저장소(public)에 연결되어 있음
- Vercel 배포는 아직 연결하지 않았음 (0단계가 끝난 뒤 연결할 예정)

# 이번 단계 범위
- Format의 폴더 구조대로 src/features(learning·exam·admin), src/components, src/lib, public/content, apps-script, firestore.rules, .env.example 만들기 (내용은 비워 둠)
- Vite 기본 예제 화면을 지우고, Design System의 색상 토큰과 Pretendard 글꼴을 적용한 빈 셸 (헤더, 빈 탭 바, 본문 영역)
- .gitignore에 .env.local이 들어 있는지 확인

# 하지 말 것
- 로그인, 탭 내용, 시험 기능은 만들지 말 것
- GitHub·Vercel 연결 설정과 Vite 설정 방식은 바꾸지 말 것

# 끝나면 보고할 것
- 폴더 구조 트리
- npm run dev로 연 화면 캡처
# 기록
- 작업이 끝나면 docs/prompt-log.md 파일을 만들고(없으면), 이번 단계에 내가 보낸 프롬프트 원문, 변경한 파일, 확인 결과를 추가해 줘. 이후 단계에서도 같은 파일에 이어서 기록해 줘.
```

후속 프롬프트: `좋아 실행!` (계획 승인)

### 변경한 파일
- 신규: `src/app/Shell.tsx`, `src/app/shell.css`, `src/app/config.ts`
- 신규: `src/components|features/learning|features/exam|features/admin|lib/.gitkeep`, `public/content/.gitkeep`
- 신규: `apps-script/Code.gs`, `firestore.rules`, `.env.example` (내용 비움/자리표시자)
- 수정: `src/App.tsx`, `src/index.css`, `index.html` (lang=ko, 제목, 설명)
- 삭제: `src/App.css`, `src/assets/` (Vite 예제)
- 유지: `.gitignore`(`*.local`이 `.env.local` 포함), `vite.config.ts`, `package.json`

### 결과
- 잘 된 점: `npm run build` 통과. `npm run dev`(localhost:5173)에서 Navy 헤더+Gold 선, 빈 탭 바, 본문 카드 표시. 390px 폭에서 가로 스크롤 없음.
- 문제점: 없음. 아직 확인하지 못한 것: 실제 휴대폰 기기, Vercel 배포.

### 추가 수정 요청
- (없음)

### 최종 확인
- [x] npm run dev 화면 확인
- [ ] Commit & Push (사용자가 직접)
### 수정 1: 앱 이름 변경 (CS Loop → LearnLoopCS)

#### 보낸 프롬프트
```
AGENTS.md의 앱 이름이 LearnLoopCS로 바뀌었어.
헤더 제목, 브라우저 탭 제목(title), 로고 배지 글자를 LearnLoopCS에 맞게 고쳐 줘. 배지는 "LL"로 해 줘.
다른 부분은 건드리지 말고, prompt-log.md에도 이 수정 내용을 추가해 줘.
```

#### 변경한 파일
- `src/app/config.ts`: `appName`을 `LearnLoopCS`로 변경 (헤더 제목에 반영)
- `src/app/Shell.tsx`: 로고 배지 글자 `CS` → `LL`
- `index.html`: `<title>`을 `LearnLoopCS`로 변경
- 변경하지 않음: `index.html`의 meta description에는 "CS Loop"가 남아 있음 (요청 범위 밖)

#### 확인 결과
- npm run dev(localhost:5173) 새로고침 후 확인: 브라우저 탭 제목 `LearnLoopCS`, 헤더 제목 `LearnLoopCS`, 배지 `LL`

