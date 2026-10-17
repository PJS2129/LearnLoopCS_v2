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





## 1단계. 공통 셸, 로그인과 학생 등록, 권한 (2026-10-16)

### 보낸 프롬프트
```
@AGENTS.md
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-1-shell.md 파일을 먼저 읽고 참고해 줘.

AGENTS.md를 기준으로 [구현 순서 1단계]만 진행해 줘.

# 현재 상태
- 0단계 완료: 빈 셸 화면, 폴더 구조, GitHub(public)과 Vercel 배포 연결됨
- Firebase 프로젝트 생성 완료: Google 로그인 사용 설정, 승인된 도메인에 localhost와 learn-loop-cs-v2.vercel.app 등록, Firestore(서울, 프로덕션 모드) 생성

# 이번 단계 범위
- spec-1-shell.md 전체: 셸 헤더와 탭 바, Google 로그인 첫 화면, 최초 학번·성명·분반 등록 모달, 권한
- 학습 탭은 public/learning-tabs.json을 읽어 자동 생성하되, 내용은 "준비 중" 카드로만 표시
- 관리자 판별은 화면 숨김과 Firestore 보안 규칙 양쪽에서 확인
- Firebase 설정값은 .env.local의 VITE_FIREBASE_* 환경 변수에서 읽고, .env.example에 필요한 항목을 적어 둘 것

# 하지 말 것
- 학습 콘텐츠, 시험, 관리자 기능 내용은 만들지 말 것 (탭 자리만)

# 끝나면 보고할 것
- 내가 .env.local에 값을 넣는 방법 (Firebase 콘솔에서 복사한 firebaseConfig 기준)
- 같은 값을 Vercel 환경 변수에 등록하는 항목 목록
- 관리자 계정을 등록하는 방법
- firestore.rules를 Firebase 콘솔에 적용하는 방법
- 보안 규칙이 막는 것과 허용하는 것을 표로 정리

# 기록
- docs/prompt-log.md에 1단계 프롬프트 원문, 변경한 파일, 확인 결과를 이어서 추가해 줘.
```

### 계획 검토 메모

| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | AI 계획에서 학생 정보(students)가 "등록 후 변경 불가"로 설계됨. 학생이 학번을 잘못 입력하면 고칠 방법이 없음 |
| 수정 요구 | 학생 본인은 수정 불가를 유지하되, 관리자는 수정할 수 있도록 보안 규칙에 허용. 수정 화면은 관리자 탭 단계에서 추가 |
| 판단 근거 | 시험 결과가 학번 기준으로 기록되므로, 오입력이 남으면 성적·분석 데이터가 어긋남 |
| 개선 결과 | firestore.rules의 students 규칙을 `update: 관리자만`으로 작성함. 학생 본인의 update와 모든 delete는 차단하고, 관리자 수정 시에도 이메일·등록 시각은 바꿀 수 없으며 학번·성명·분반 형식 검증을 다시 거침. 등록 모달에도 "등록 후에는 직접 고칠 수 없고 교수님께 알려 달라"는 안내를 표시함. 수정 화면은 만들지 않았고 관리자 탭 단계로 남김. 규칙 문법은 이 환경에서 에뮬레이터로 실행해 보지 못했고, 콘솔에 게시할 때의 문법 검사와 실제 수정 시도로 확인해야 함. |

### 함께 확정한 설계
- 관리자 판별: 이메일 목록 대신 Firestore admins 문서 존재 여부로 확인 (공개 저장소에 이메일을 올리지 않기 위함)
- 분반 선택지(A반·B반): config.ts에 둠

후속 프롬프트: 관리자 판별은 admins 컬렉션 방식, 분반은 config.ts에 두기로 승인하고, students 관리자 수정 허용 규칙과 위 기록 추가를 요청함.

### 변경한 파일
- 신규: `src/lib/firebase.ts`, `src/lib/auth.tsx`, `src/lib/types.ts`
- 신규: `src/components/Modal.tsx`, `src/components/modal.css`, `src/components/Icon.tsx`
- 신규: `src/features/auth/LoginScreen.tsx`, `RegisterModal.tsx`, `auth.css`
- 신규: `src/features/learning/TabPlaceholder.tsx`, `public/learning-tabs.json`
- 수정: `src/App.tsx`, `src/app/Shell.tsx`, `src/app/shell.css`, `src/app/config.ts`(분반·소개 문구), `firestore.rules`
- 수정: `package.json`, `package-lock.json` (firebase 추가)
- 유지: `.env.example`(이미 필요한 항목이 있어 그대로), `vite.config.ts`

### 확인 결과
- 확인함: `npm run build` 통과. `npm run lint` 오류 0, 경고 1(useAuth 내보내기 관련 fast refresh 경고). `.env.local`은 없고 `.gitignore`에 포함됨.
- 확인하지 못함: `.env.local`이 없을 때 "Firebase 설정이 필요해요" 안내 화면이 뜨는지(브라우저 확인 결과를 받지 못함), 실제 Google 로그인, 등록 모달 저장, 관리자 탭 표시, Firestore 규칙 동작, 모바일 탭 칩 화면. `.env.local`과 규칙 적용, admins 문서 등록 후 확인해야 함.

### 추가 수정 요청
- (없음)

### 최종 확인
- [x] 빌드·린트
- [ ] .env.local 입력 후 로그인·등록 확인 (사용자)
- [ ] 규칙 게시와 admins 문서 등록 (사용자)
- [ ] Commit & Push (사용자)


## 2-1단계. 학습 탭 슬롯 구조와 알고리즘 인터랙티브 스튜디오 (2026-10-17)

### 보낸 프롬프트
```
@AGENTS.md
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-2-learning.md 파일을 먼저 읽고 참고해 줘.

AGENTS.md를 기준으로 [구현 순서 2단계] 중 다음만 진행해 줘.

# 현재 상태
- 1단계 완료: 셸, Google 로그인, 학생 등록, 관리자 판별(admins 컬렉션), Firestore 보안 규칙 적용
- 학습 탭은 public/learning-tabs.json에서 자동 생성되고 지금은 "준비 중" 카드만 표시됨

# 이번 단계 범위
- spec-2-learning.md의 "2. 학습 탭 슬롯 구조": 슬롯 유형에 따라 iframe(sandbox)으로 콘텐츠를 불러오기, 준비 중 카드, 활동 신호(postMessage) 수신
- "3. 알고리즘 인터랙티브 스튜디오" 전체를 public/content/algorithm.html 단일 파일로 만들기 (외부 파일 없이 동작)
- 활동 신호는 지금은 콘솔에 출력만 하고, Firestore 저장은 2-3단계에서 연결

# 하지 말 것
- 논리회로, 개념 카드, 학습 이력 저장은 만들지 말 것
- 1단계의 로그인·권한 코드와 보안 규칙은 바꾸지 말 것

# 끝나면 보고할 것
- 6개 알고리즘(선형·이진 탐색, 버블·선택·삽입·퀵 정렬)을 각각 실행한 화면 캡처
- 실행 중 중단 후 다시 시작했을 때의 동작 설명
- 좁은 화면(모바일 폭)에서의 화면 캡처

# 기록
- docs/prompt-log.md에 2-1단계 프롬프트 원문, 변경한 파일, 확인 결과를 이어서 추가해 줘.
```

### 계획 검토 메모

| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | AI 계획에서 중단 시 막대를 처음 상태로 초기화하도록 설계됨. 학생이 멈춘 장면을 관찰할 수 없음 |
| 수정 요구 | 중단 시 그 순간의 상태와 설명을 유지(PAUSED), 다시 시작하면 원래 데이터로 처음부터 실행 |
| 판단 근거 | 이 도구의 목적은 데이터가 이동하는 이유를 관찰하는 것이므로, 멈춘 장면이 곧 학습 장면임 |
| 개선 결과 | 중단하면 막대의 색·값과 마지막 실행 가이드 문장을 그대로 두고 상태 배지만 PAUSED로 바꿈(가이드 끝에 "일시 중단됨" 안내만 덧붙임). 중단 후 이전 실행은 화면을 더 바꾸지 않음. 다시 [시뮬레이션 시작]을 누르면 이번 데이터의 원본(base)으로 되돌린 뒤 처음부터 실행하고, 완전히 새 데이터는 [데이터 재생성]으로 만듦. 브라우저에서 PAUSED 화면 유지를 직접 확인함(퀵·버블, 데스크톱·375px 폭). 재시작은 비교 위치가 중단 지점에서 앞쪽으로 되돌아가 처음부터 다시 실행됨을 확인함. 다만 재시작 직후 막대 값이 원본과 같은지는 화면 캡처만으로는 구별할 수 없어(그 시점까지 값이 바뀌지 않았음) 코드(showBase) 기준으로만 확인함. |

### 후속 프롬프트
활동 신호 형식을 `tab: "algorithm"`, `activity: "start" | "complete"`, `detail: 알고리즘 이름`으로 확정하고, 중단 후 동작을 위 메모대로 바꾸라고 요청함.

### 변경한 파일
- 신규: `public/content/algorithm.html` (외부 파일 없는 단일 HTML, 알고리즘 6종)
- 신규: `src/features/learning/SlotView.tsx` (슬롯 유형별 iframe(sandbox="allow-scripts") / 준비 중 카드, 활동 신호 수신)
- 신규: `src/features/learning/activity.ts` (활동 신호 형식 검증, 콘솔 출력. Firestore 저장은 2-3단계에서 `recordActivity`를 교체)
- 신규: `src/features/learning/learning.css`
- 수정: `src/app/Shell.tsx` (학습 탭이면 SlotView 렌더링, 이력·시험·관리자 탭은 기존 준비 중 카드 유지)
- 수정하지 않음: 1단계 로그인·권한 코드(`auth.tsx` 등), `firestore.rules`, `learning-tabs.json`

### 확인 결과
- 확인함: `npm run build` 통과, `npm run lint` 오류 0(경고 1은 1단계와 동일한 useAuth fast refresh 경고).
- 확인함(브라우저, `localhost:5173/content/algorithm.html`을 직접 열어 확인): 정렬 4종과 탐색 2종이 실행되어 완료(COMPLETED) 상태에 도달하고, 정렬은 막대가 모두 초록, 탐색은 찾은 막대가 초록·나머지 회색으로 표시됨. 실행 중 색(비교 노랑·교환 빨강·피벗 보라)과 PAUSED 화면 확인.
- 확인함: 375px 폭(폭 375px iframe으로 재현)에서 설정·분석·시각화 카드가 세로로 쌓이고 페이지 가로 스크롤 없음. 개수 60일 때 숫자 11px가 읽히며 막대 영역 안에서만 가로 스크롤됨. 개수 20에서도 막대 영역이 좁아 막대 영역 안 가로 스크롤이 생김(막대 최소 폭 16px 유지 때문).
- 확인하지 못함: 앱 셸 안에서 iframe으로 불러오는 화면과 `[activity]` 콘솔 로그(로그인이 필요해 이 환경에서 접속하지 못함), 없는 숫자를 찾는 "찾지 못했어요" 장면, 실행 중 각 알고리즘의 중간 장면 캡처 전체(일부만 확보), 실제 스마트폰 기기.
- 확인하지 못함: 논리회로 탭의 "준비 중" 카드 전환(logic.html이 아직 없음, 코드상 동작).

### 추가 수정 요청
- (없음)

### 최종 확인
- [x] 빌드·린트
- [ ] 앱 셸에서 알고리즘 탭 열람과 `[activity]` 콘솔 로그 확인 (사용자)
- [ ] Commit & Push (사용자)

## 2-2단계: 논리회로 랩 (public/content/logic.html)

### 프롬프트
```
@AGENTS.md
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-2-learning.md와 docs/prompt-log.md를 먼저 읽고 참고해 줘.

AGENTS.md를 기준으로 [구현 순서 2단계] 중 다음만 진행해 줘.

# 현재 상태
- 2-1단계 완료: 학습 탭 슬롯(iframe sandbox, 준비 중 카드, 활동 신호 수신)과 public/content/algorithm.html 동작 확인
- 2-2단계(논리회로 랩)는 이전 대화에서 계획을 승인했지만, AI 사용량 한도로 중단되어 파일이 만들어지지 않음

# 이번 단계 범위
- spec-2-learning.md의 "4. 논리회로 랩" 전체를 public/content/logic.html 단일 파일로 만들기 (외부 파일 없이 동작)
- 게이트 7종(AND, OR, XOR, NOT, NAND, NOR, XNOR)은 IEEE 표준 기호(SVG), SWITCH와 LED 포함
- 마우스와 터치 모두 지원 (포인터 이벤트, 단자 터치 영역 넓게, 터치에서는 선택 시 삭제 버튼 표시)
- 연결되지 않은 입력은 0으로 계산하지 말고 "입력 미연결"로 표시
- CLEAR는 커스텀 모달로 한 번 확인 (alert, confirm 사용 금지)
- 회로 설명 패널: 전체 요약, 게이트별 카드, 진리표에서 현재 입력에 해당하는 행 강조
- 처음 열면 SWITCH 두 개 → XOR → LED 예시 회로 배치

# 이전 대화에서 합의한 추가 사항
1. 게이트별 카드에 현재 입력과 규칙을 연결한 한 문장 설명을 추가
   - 예: XOR "지금 입력이 1과 0으로 서로 다르므로 출력은 1입니다", AND "입력 중 0이 있으므로 출력은 0입니다"
   - 입력이 바뀌면 문장도 바로 바뀜
   - 입력 미연결 시 "입력을 모두 연결하면 결과를 설명해 드려요"
2. 활동 신호 형식: {type:"activity", tab:"logic", activity:"start"|"explain", detail:사용한 게이트 종류, duration:밀리초}
   - algorithm.html과 같은 형식과 단위(ms)를 쓸 것

# 하지 말 것
- 플랫폼 코드(슬롯, 로그인, 권한)와 algorithm.html은 바꾸지 말 것
- 개념 카드, 학습 이력 저장은 만들지 말 것

# 끝나면 보고할 것
- 게이트 7종을 실제 입력으로 확인한 진리표 결과
- 예시 XOR 회로와 회로 설명 패널 화면 캡처
- 터치(기기 툴바 모드)에서 게이트 이동과 전선 연결 확인 결과
- 직접 확인하지 못한 항목은 따로 구분

# 기록
- docs/prompt-log.md에 2-2단계 기록을 추가해 줘. 아래 내용을 포함해 줘.
  - 이번 프롬프트 원문, 변경한 파일, 확인 결과
  - 중단 기록: "이전 대화에서 Claude 모델 사용량 한도로 작업 중단, 파일 미생성. 다른 모델로 새 대화를 열어 같은 요구사항으로 재진행"
  - 아래 계획 검토 메모를 문구 그대로
```

### 중단 및 재진행 기록
이전 대화에서 Claude 모델 사용량 한도로 작업 중단. 화면에는 변경 파일 0개로 표시됐으나 logic.html 초안(673행)이 저장되어 있었음. 다른 모델로 새 대화를 열어 초안을 점검하고 보완함

### 계획 검토 메모 (초기 계획)
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | 진리표에서 현재 행은 강조되지만, 왜 그 결과가 나오는지는 설명되지 않음 |
| 수정 요구 | 게이트별 카드에 현재 입력과 규칙을 연결한 한 문장 설명 추가 (알고리즘 실행 가이드와 같은 방식) |
| 판단 근거 | 학생이 진리표를 외우는 것이 아니라, 입력에 따라 출력이 정해지는 규칙을 이해하는 것이 목표이기 때문 |
| 개선 결과 | 게이트별 카드에 입력 상태와 이유를 결합한 설명 문장("지금 입력이 1과 0으로 서로 다르므로 출력은 1입니다" 등)이 실시간 연동됨을 브라우저에서 확인함. 미연결 시 "입력을 모두 연결하면 결과를 설명해 드려요" 표시 확인. |

### 계획 검토 메모 (재진행)
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | 초안이 미연결 입력을 0으로 계산해, NOT·NAND·NOR가 아무것도 연결하지 않아도 출력 1을 냄 |
| 수정 요구 | 미연결 입력은 "입력 미연결"로 표시하고 출력을 만들지 않도록 수정. LED도 미연결과 꺼짐(0)을 구분 |
| 판단 근거 | 연결하지 않았는데 불이 켜지면 학생이 게이트 규칙을 잘못 이해할 수 있음 |
| 개선 결과 | 미연결 단자는 `null`로 처리되어 게이트 출력을 내지 않음(NOT 추가 시 출력 1로 켜지지 않고 꺼짐 유지, 설명 패널에 '입력 미연결 → 출력 미연결' 및 안내문 표시). LED도 입력 미연결 시 회색 점선 테두리와 '미연결' 문구로 표시되고 요약에도 'LED: 미연결'로 구분됨을 브라우저에서 직접 확인함. |

### 변경한 파일
- 수정/보완: `public/content/logic.html` (외부 의존성 없는 단일 HTML 시뮬레이터. IEEE 표준 기호 게이트 7종, SWITCH, LED, 미연결 Tri-state 처리, 커스텀 CLEAR 모달, 실시간 한 문장 설명 및 진리표 행 강조, 반응형 터치 인터랙션, 활동 신호)
- 수정하지 않음: 플랫폼 코드(`src/*`), `algorithm.html`, `public/learning-tabs.json`

### 확인 결과
- 확인함: `npm run build` 통과, `npm run lint` 통과 (0 error, 1 warning은 1단계 useAuth fast refresh 경고 유지).
- 확인함(게이트 7종 진리표 로직): 7개 게이트의 모든 입력 조합(24개 조합)에 대해 기대값과 시뮬레이션 출력값이 100% 일치함을 테스트 스크립트로 검증.
- 확인함(브라우저, `localhost:5173/content/logic.html`):
  - 초기 예시 회로(SWITCH 두 개 → XOR → LED)가 로드되고, SW1=1, SW2=0일 때 XOR 출력 1(주황색 발광선) 및 LED1 ON 상태 정상 표시.
  - 설명 패널에서 전체 요약(`SW1: 1`, `SW2: 0`, `LED1: ● ON`)과 XOR 카드(`입력 1, 0 → 출력 1`, `지금 입력이 1과 0으로 서로 다르므로 출력은 1입니다.`, 진리표 행 [1, 0 -> 1] `▶` 강조) 일치 확인.
  - SW1 토글 시(0으로 변경) 즉시 XOR 출력 0(회색선), LED1 OFF, 설명 패널 및 진리표 행([0, 0 -> 0] `▶` 강조, `지금 입력이 0과 0으로 서로 같으므로 출력은 0입니다.`) 실시간 갱신 확인.
  - NOT 게이트 및 LED2 추가 시: 미연결 상태에서 NOT 출력이 켜지지 않고, 패널에 `입력 미연결 → 출력 미연결` 표시, LED2는 회색 점선 테두리와 `미연결` 텍스트로 표시됨을 확인.
  - 단자 클릭을 통한 전선 연결 정상 동작 확인 (NOT 출력 → LED2, SW1 출력 → NOT 입력 연결 시 LED2 ON 점등).
  - CLEAR 클릭 시 커스텀 확인 모달(`회로를 모두 지울까요?`) 오픈 및 취소 시 모달 닫힘 동작 확인.
  - 모바일 폭(375x700): 상단 툴바 줄바꿈, 44px 이상 터치 영역 유지, 가로 스크롤 없음, 설명 패널 모바일 슬라이드인 확인.
- 확인하지 못함: 앱 셸 안에서 학습 이력 저장을 통한 Firestore 반영(2-3단계 예정), 실제 물리 스마트폰 기기에서의 터치 압력/제스처 느낌.

### 추가 수정 요청
- 논리회로 진입 시 예시 회로(XOR)를 배치하지 않고 빈 캔버스로 시작하도록 변경.
- 부품이 없을 때 상단 힌트에 "상단 메뉴에서 부품(SWITCH, LED, 게이트)을 추가해 회로를 만들어 보세요." 안내 추가.
- 브라우저에서 빈 화면 진입 및 설명 패널의 빈 상태 안내 문구 정상 표시 확인.

### 최종 확인
- [x] 빌드·린트
- [ ] 앱 셸에서 논리회로 탭 열람 및 postMessage 콘솔 로그 확인 (사용자)
- [ ] Commit & Push (사용자)



## 2-3단계: 개념 카드·연습 문제 공통 화면, 학습 이력 Firestore 저장, 학습 이력 탭 (2026-10-17)

### 보낸 프롬프트 1 (계획 요청)
```
@AGENTS.md 
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-2-learning.md의 "2. 학습 탭 슬롯 구조", "5. 개념 카드·연습 문제", "6. 학습 이력과 맞춤 복습"과 docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 2단계]의 마지막 부분인 2-3단계를 진행해 줘.

# 현재 상태
- 1단계(로그인, 학생 등록, 관리자 확인) 완료
- 2-1 알고리즘(algorithm.html), 2-2 논리회로(logic.html) 완료, 활동 신호 전송 확인됨
- 플랫폼은 활동 신호를 받기만 하고 아직 저장하지 않음

# 이번 단계 범위
1. 개념 카드·연습 문제 공통 화면
   - 하나의 공통 화면으로 만들고, public/content/[영역].json만 바꾸면 다른 내용이 나오게 할 것
   - JSON 형식을 먼저 정해서 계획에 보여 줘 (나중에 MCP 출제 프롬프트가 이 형식으로 만들 예정)
   - 확인용 샘플 JSON은 한 영역만, 개념 카드 4개, 연습 문제 3개로 작게 만들 것
   - JSON이 없는 영역은 기존처럼 "준비 중" 카드 표시
   - 연습 문제는 한 화면에 한 문제, 제출하면 바로 정답 여부와 해설 표시
2. 학습 이력 저장 (Firestore)
   - 활동 신호, 탭 열람 시간, 연습 문제 결과를 저장
   - 연습 문제 결과는 시험 점수와 다른 곳에 저장해 섞이지 않게 할 것
   - 저장 구조와 보안 규칙(학생은 본인 것만 쓰고 읽기, 관리자는 읽기)을 계획에 먼저 보여 줘
   - 신호가 올 때마다 바로 쓰지 말고, 너무 잦은 저장이 되지 않게 방법을 제안해 줘
3. 학습 이력 탭
   - 영역별 학습 시간 막대, 최근 활동 목록(시각, 탭, 활동), 연습 문제 정답률
   - 기록이 없을 때 안내 문구 표시

# 하지 말 것
- 맞춤 복습 버튼은 성적 공개(5-2단계) 이후에 만들 것. 이번에는 만들지 않음
- algorithm.html, logic.html은 바꾸지 말 것
- 시험, 관리자 화면은 만들지 말 것

# 끝나면 보고할 것
- 바뀐 파일 목록과 firestore.rules 변경 내용 (내가 Firebase 콘솔에 직접 게시해야 하는지 알려 줘)
- 샘플 영역에서 카드 펼치기, 문제 풀기, 이력 탭 반영 확인 결과
- 다른 학생 계정의 이력은 보이지 않는지 확인 방법
- 직접 확인하지 못한 항목은 따로 구분

# 기록
- docs/prompt-log.md에 2-3단계 기록 추가 (프롬프트 원문, 변경 파일, 확인 결과, 계획 검토 메모 자리)
```

### 보낸 프롬프트 2 (계획 승인 및 추가 요구사항)
```
계획 승인합니다. 다만 아래를 반영해서 진행해 줘.

1. 정답률은 첫 시도 기준
   - 문제별로 첫 시도 결과(firstAttempt)를 따로 저장하고, 정답률은 첫 시도로 계산
   - 다시 푼 결과는 시도 기록으로 추가하되 첫 시도 결과를 덮어쓰지 않을 것
   - 이력 탭에 "첫 시도 정답률"이라고 표시
2. 영역 이름 하드코딩 금지
   - 집계 키는 탭 id(algorithm, logic, ict 등)를 쓰고, 화면 표시 이름과 영역 목록은 learning-tabs.json에서 읽을 것
3. 보안 규칙 강화
   - learning_logs, practice_results: 본인 생성(create)만 허용, 수정·삭제 금지 (첫 시도 기록 포함)
   - learning_stats/summary: 본인만 쓰기, 삭제 금지
   - 필드 형식(숫자, 문자열 등)도 규칙에서 간단히 검사
   - 관리자는 읽기만
4. 화면을 보고 있을 때만 시간 측정
   - visibilitychange로 화면이 가려지면 타이머 정지, 다시 보이면 재개
5. 오답 시 관련 개념 카드 연결
   - 문제 JSON에 cardId 필드 추가 (선택 항목)
   - 오답이면 [관련 개념 다시 보기] 버튼 → 개념 카드 탭으로 이동해 해당 카드를 펼침
6. 탭 표시에 이모지 대신 기존 Icon 컴포넌트 사용 (AGENTS.md 디자인 규칙)
7. 샘플 JSON의 reference는 실제 강의자료가 아니므로 "샘플 데이터"임을 알 수 있게 표기

firestore.rules가 바뀌면 끝난 뒤 Firebase 콘솔에 게시하는 방법을 단계별로 알려 줘.

prompt-log의 2-3단계 기록에 아래 계획 검토 메모를 문구 그대로 넣어 줘.

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 다시 풀기 결과가 이전 기록을 덮어써 정답률이 부풀려짐 ② 영역 이름을 코드에 고정해 슬롯 원칙과 어긋남 ③ 학생이 자기 학습 기록을 수정·삭제할 수 있음 |
| 수정 요구 | 첫 시도 기준 정답률, 탭 id 기반 집계, 기록은 추가만 허용, 화면을 볼 때만 시간 측정, 오답 시 관련 개념 카드 연결 |
| 판단 근거 | 학습 이력은 학생의 실제 이해 상태를 보여 줘야 하며, 틀린 문제가 개념 복습으로 이어져야 학습 루프가 완성됨 |
| 개선 결과 | (작업 후 확인 결과) |
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 다시 풀기 결과가 이전 기록을 덮어써 정답률이 부풀려짐 ② 영역 이름을 코드에 고정해 슬롯 원칙과 어긋남 ③ 학생이 자기 학습 기록을 수정·삭제할 수 있음 |
| 수정 요구 | 첫 시도 기준 정답률, 탭 id 기반 집계, 기록은 추가만 허용, 화면을 볼 때만 시간 측정, 오답 시 관련 개념 카드 연결 |
| 판단 근거 | 학습 이력은 학생의 실제 이해 상태를 보여 줘야 하며, 틀린 문제가 개념 복습으로 이어져야 학습 루프가 완성됨 |
| 개선 결과 | ① `practice_results`에 시도별 문서를 추가(create 전용)하고 summary에 `quizzes[quizId].firstCorrect`를 고정 보존하여 첫 시도 정답률을 정확히 집계. ② `timeByTab`에 탭 id만 저장하고 표시 이름/영역은 `learning-tabs.json`에서 읽어 동적 렌더링. ③ `firestore.rules`에서 `learning_logs`와 `practice_results`의 `update, delete`를 전면 차단. ④ `visibilitychange`로 화면 숨김 시 타이머 정지 및 플러시. ⑤ 문제 오답 시 `[관련 개념 다시 보기]` 버튼으로 해당 카드로 바로 이동 및 자동 펼침 확인. |

### 변경한 파일
- 신규: `public/content/ict.json` (기초 ICT 영역 샘플 데이터: 개념 카드 4개, 4지선다 연습 문제 3개, 관련 cardId 및 샘플 근거 자료)
- 신규: `src/features/learning/ConceptQuizViewer.tsx` (개념 카드 그리드/아코디언 토글, 1화면 1문제 연습 문제, 정답 피드백, 오답 시 관련 개념 카드 이동)
- 신규: `src/features/learning/HistoryView.tsx` (총 학습 시간, 첫 시도 정답률, 탭 id 기반 영역별 시간 막대, 최근 활동 타임라인, 빈 상태 안내)
- 신규: `src/features/learning/learningHistory.ts` (인메모리 버퍼링, 30초/탭전환 플러시, visibilitychange 가시성 감지, Firestore 통신)
- 수정: `src/components/Icon.tsx` (CheckIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, TargetIcon, RotateCcwIcon, ArrowRightIcon 추가)
- 수정: `src/lib/types.ts` (ConceptCard, PracticeQuiz, ConceptQuizContent, LearningSummary, LearningLog 타입 추가)
- 수정: `src/features/learning/SlotView.tsx` (tab.type이 'cards'일 때 JSON 로드 및 ConceptQuizViewer 연동, 미존재 시 TabPlaceholder 유지)
- 수정: `src/features/learning/activity.ts` (recordActivity 신호를 learningHistory 큐로 연결)
- 수정: `src/features/learning/learning.css` (개념 카드, 연습 문제, 피드백 카드, 타임라인, 막대 게이지 CSS 스타일)
- 수정: `src/app/Shell.tsx` (학습 탭 체류 시간 측정 시작/중지, 가시성/페이지 이탈 이벤트 리스너, 학습 이력 탭 렌더링 연결)
- 수정: `firestore.rules` (learning_stats/summary, practice_results, learning_logs 서브컬렉션 읽기/쓰기 격리 및 보안 규칙 강화)

### 확인 결과
- 확인함: `npm run build` 통과, `npm run lint` 통과 (0 error, 1 warning은 1단계 useAuth fast refresh 경고 유지).
- 확인함(브라우저, `localhost:5173`):
  - `기초 ICT` 탭 진입: `ict.json` 정상 로드, 상단 서브탭(`개념 카드 (4)` / `연습 문제 (3)`) 아이콘 정상 표시.
  - 개념 카드 1번('컴퓨팅 사고력') 클릭 시 부드럽게 펼쳐지며 '구체적 예시'와 '근거 자료: 기초 ICT 샘플 자료 (컴퓨팅 사고의 4대 요소)' 표시 확인.
  - '연습 문제' 서브탭 진입: 1번 문제에서 오답(1번 '분해') 제출 시 빨간 테두리 피드백, 오답 배지, 정답 보기 표시, 해설 및 `[관련 개념 다시 보기]` 버튼 노출 확인.
  - `[관련 개념 다시 보기]` 클릭 시 '개념 카드' 탭으로 전환되며 1번 카드가 자동으로 펼쳐지고 스크롤 이동됨 확인.
  - '다시 풀기' 후 1번 정답(2번 '추상화') 제출 시 초록 피드백(`is-correct`) 확인. 2번, 3번 문제 순차 풀이 및 피드백 동작 확인.
  - `하드웨어`, `데이터 표현` 탭 진입: JSON 파일이 없으므로 "하드웨어·CPU 학습 콘텐츠를 준비 중이에요." 준비 중 카드가 정상 유지됨을 확인.
  - `학습 이력` 탭 진입: 총 학습 시간, 첫 시도 정답률, 영역별 학습 시간 막대, 최근 활동 목록 컴포넌트 렌더링 확인.
- 확인하지 못함:
  - 현재 로컬 브라우저에서 Firestore 쓰기/읽기 시 `FirebaseError: Missing or insufficient permissions`가 발생함. 이는 원격 Firebase 콘솔에 아직 1단계 보안 규칙만 게시되어 있기 때문이며, 업데이트된 `firestore.rules`를 Firebase 콘솔에 게시한 뒤 정상 동작함을 확인해야 함.
  - 실제 물리 스마트폰 기기에서의 화면 터치감.

### 최종 확인
- [x] 빌드·린트
- [x] 브라우저 UI 및 인터랙션 검증 (개념 카드 펼침, 퀴즈 오답 피드백, 개념 연계, 준비 중 탭)
- [ ] Firebase 콘솔에 `firestore.rules` 게시 및 실제 Firestore 기록 반영 확인 (사용자)
- [ ] Commit & Push (사용자)


