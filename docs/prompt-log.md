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


## 3-1단계. 관리자 탭 기본 틀과 문항 관리·검토 (2026-10-17)

### 보낸 프롬프트
```
@[AGENTS.md] 
 먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-4-admin.md의 "9. 관리자 탭"과 "9-1. 문항 관리", docs/prompts/02-2_출제_프롬프트_MCP.md, docs/prompts/02-3_분석_프롬프트_MCP.md, docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 3단계]를 둘로 나눠 이번에는 3-1단계만 진행해 줘.

# 현재 상태
- 1단계(로그인, 학생 등록, 관리자 확인), 2단계(학습 탭, 개념 카드·연습 문제, 학습 이력) 완료, Vercel 배포 확인
- 관리자는 Firestore admins/{이메일} 문서로 확인함
- Google Drive에 출제용 폴더, 강의자료, 출제 가이드, 결과 시트 준비 완료

# 이번 단계 범위 (3-1)
1. 관리자 탭 틀
   - spec의 Navy 사이드 메뉴와 Gold 강조로 학생 화면과 구분
   - 메뉴 6개(문항 관리, 시험 운영, 시험 미리보기, 성적과 분석, 성적 공개, 학습 콘텐츠 관리)를 만들고 문항 관리 외에는 "준비 중" 표시
   - 관리자가 아니면 관리자 탭이 보이지 않고, 주소로 직접 들어와도 화면이 열리지 않을 것
2. 문항 JSON 가져오기
   - 파일 업로드와 붙여 넣기 둘 다 지원
   - 형식은 02-2 프롬프트의 시험 문항(exam.json) 형식을 따름 (answer는 1부터 시작하는 번호)
3. 형식 검사 (가져오기 전에)
   - 문항 수, 선택지 수(4개), 정답 범위(1~4), 영역 태그(5개 영역 중 하나), 난이도(상·중·하), 근거(source) 누락, 중복 번호
   - 오류는 문항 번호와 이유를 목록으로 보여 주고, 총 문항 수 불일치는 경고로 표시
4. 검토 화면
   - 전체 문항을 한 화면에 표로 (번호, 질문, 선택지, 정답, 영역, 난이도, 근거, 해설)
   - 문항별로 바로 수정 가능, 수정하면 검사 다시 실행
   - 위쪽에 영역별·난이도별 문항 수 요약과 정답 번호(1~4) 분포, review:true 문항은 눈에 띄게 표시
5. 임시 보관
   - 정답이 포함된 초안은 Firestore에 저장하지 말 것. 확정 전까지는 관리자 브라우저에만 임시 보관(새로고침해도 유지)
   - [초안 비우기] 버튼은 확인 모달로 한 번 더 묻기
6. 확인용 샘플 2개를 docs/samples/에 만들어 줘
   - exam-sample.json: 영역 5개가 고루 들어간 정상 문항 10개
   - exam-error-sample.json: 일부러 틀린 문항(정답 범위 초과, 영역 오타, 선택지 3개, 근거 누락)이 섞인 파일
7. 출제·분석 프롬프트 정리 (docs/prompts/02-2, 02-3)
   - 2-3단계에서 실제 구현한 개념 카드 JSON 형식(public/content/ict.json)에 맞춰 02-2의 "학습 탭 콘텐츠" 형식 예시를 수정
   - 용어 "출제 청사진"은 "출제 가이드"로 통일
   - Drive 경로를 실제 폴더로 반영
     | 용도 | Drive 경로 |
     | --- | --- |
     | 강의자료 | 내 드라이브/LearnLoopCS/01 강의자료 |
     | 출제 가이드 | 내 드라이브/LearnLoopCS/02 출제가이드/출제가이드_컴퓨터공학개론 |
     | AI 초안 저장 | 내 드라이브/LearnLoopCS/03 AI 초안 |
     | 결과 시트 | 내 드라이브/LearnLoopCS/04 결과/LearnLoopCS_결과 |
   - 02-2 Variables에 영역별 근거 자료 표 추가, 출제 범위는 01~05
     | 영역 | 근거 자료 |
     | --- | --- |
     | 기초 ICT | 01. 디지털세상 |
     | 하드웨어·CPU | 02. 컴퓨터시스템의 기초 |
     | 데이터 표현 | 03. 데이터표현 |
     | 논리회로 | 04. 논리회로 |
     | 자료구조·알고리즘 | 05. 컴퓨팅사고와 알고리즘 |
   - 근거 표기는 "자료 번호 + 페이지" (예: 03. 데이터표현 p.12)
   - 02-2 Constraints에 추가: "01 강의자료의 01~05 파일과 02 출제가이드만 읽고, 04 결과 폴더는 열지 않는다"
   - 02-3 Constraints에 추가: "결과 시트에서는 익명분석 탭만 읽고, 학번·성명이 있는 탭은 열지 않는다"
   - 바꾼 전후를 보고해 줘

# 하지 말 것
- [점검 완료], Apps Script, 시트 연결, Firestore에 문항 저장은 3-2단계에서 함. 이번에는 [점검 완료] 버튼만 비활성 상태로 자리만 둘 것
- 학생 화면, 시험 탭은 바꾸지 말 것

# 끝나면 보고할 것
- 바뀐 파일 목록과 firestore.rules 변경 여부
- 정상 샘플과 오류 샘플을 가져왔을 때 화면 결과
- 학생 계정으로 관리자 화면에 들어갈 수 없는지 확인 결과
- 직접 확인하지 못한 항목은 따로 구분

# 기록
- docs/prompt-log.md에 3-1단계 기록 추가 (프롬프트 원문, 변경 파일, 확인 결과, 계획 검토 메모 자리)
```

### 보낸 프롬프트 2 (계획 승인 및 추가 요구사항)
```
계획 승인합니다. 다만 아래를 반영해서 진행해 줘.

1. 원본 프롬프트 사용
   - docs/prompts/에 원본 02-2, 02-3 파일을 넣어 두었어. 새로 작성하지 말고 이 원본을 기준으로 수정해 줘
   - 원본의 Context, Role, Variables, Task, Constraints, Format 구조는 유지할 것
2. 항목 이름은 02-2의 exam.json 형식과 정확히 일치시킬 것
   - { exam, domains, questions: [{ no, domain, level, question, choices, answer, concept, source, explanation, review }] }
   - 타입, 검사기, 샘플, 화면 모두 이 이름을 그대로 사용 (id, options, area, difficulty로 바꾸지 말 것)
   - concept(핵심 개념)도 검토 표에 표시하고, 같은 concept이 두 번 이상 나오면 경고
3. 임시 보관 안내
   - 검토 화면에 "초안은 이 브라우저에만 저장됩니다. 공용 PC에서는 작업 후 [초안 비우기]를 눌러 주세요" 안내 표시
4. 표현
   - 관리자 화면 차단은 화면 단계의 차단이고, 데이터 보호는 3-2단계 보안 규칙에서 함
   - 보고와 기록에 "원천 차단", "완벽히" 같은 과장 표현은 쓰지 말 것

prompt-log의 3-1단계 기록에 아래 계획 검토 메모를 문구 그대로 넣어 줘.
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 원본 출제·분석 프롬프트가 프로젝트에 없어 AI가 새로 작성하려 함 ② 문항 타입의 항목 이름(id, options, area, difficulty)이 출제 프롬프트의 exam.json 형식(no, choices, domain, level)과 달라 MCP 출제 결과를 가져올 수 없음 |
| 수정 요구 | 원본 프롬프트를 기준으로 수정, 항목 이름을 exam.json 형식과 정확히 일치, concept 표시와 중복 경고 추가 |
| 판단 근거 | 출제 프롬프트(설계도)와 가져오기 화면(구현)이 같은 형식을 써야 MCP 출제 → 검토 → 확정 흐름이 끊기지 않음 |
| 개선 결과 | ① 원본 프롬프트 구조(Context, Role, Variables, Task, Constraints, Format)를 보존하고 Drive 경로·근거자료 표·콘텐츠 예시·보안 제약을 정확히 반영. ② ExamQuestion 타입을 { no, domain, level, question, choices, answer, concept, source, explanation, review }로 일치시키고 검토 표에 concept 열 표시 및 2회 이상 중복 시 경고 배너 출력 구현. ③ 임시 보관 안내 띠 및 로컬스토리지 보관 적용. |

### 변경한 파일
- 수정: `docs/prompts/02-2_출제_프롬프트_MCP.md` (출제 가이드 용어 통일, Drive 경로 4종 반영, 01~05 영역별 근거자료 표 추가, ict.json 기반 학습 콘텐츠 형식 갱신, 04 결과 폴더 접근 차단 제약 추가)
- 수정: `docs/prompts/02-3_분석_프롬프트_MCP.md` (결과 시트 Drive 경로 반영, 익명분석 탭 전용 및 개인정보 탭 열람 차단 제약 추가)
- 신규: `docs/samples/exam-sample.json` (5대 영역 균등 10문항, 4지선다, 정상 검증용 샘플)
- 신규: `docs/samples/exam-error-sample.json` (선택지 3개, 정답 5, 번호 중복, 영역 오타, 근거 누락, 개념 중복 등 결함 검증용 샘플)
- 신규: `src/features/admin/types.ts` (02-2 exam.json 스키마와 1:1 일치하는 타입 정의)
- 신규: `src/features/admin/validator.ts` (형식 검사기, 영역/난이도/정답분포 통계 계산 함수)
- 신규: `src/features/admin/adminDraftStorage.ts` (localStorage 기반 임시 보관/비우기 유틸)
- 신규: `src/features/admin/admin.css` (Navy 사이드바, Gold 강조, 통계 카드, 검토 테이블 스타일)
- 신규: `src/features/admin/ImportModal.tsx` (파일 업로드 드래그앤드롭 및 JSON 붙여넣기 탭 모달)
- 신규: `src/features/admin/QuestionEditModal.tsx` (문항별 실시간 인라인/모달 수정 폼)
- 신규: `src/features/admin/QuestionTable.tsx` (번호, 상태, 영역, 난이도, 개념, 질문, 선택지, 정답, 근거, 해설 테이블)
- 신규: `src/features/admin/QuestionManager.tsx` (통계 대시보드, 유효성 검사 리포트, 안내 띠, [점검 완료 (비활성)] 배치)
- 신규: `src/features/admin/AdminLayout.tsx` (6개 메뉴 사이드바, 화면 단계 비관리자 차단 안내)
- 수정: `src/app/Shell.tsx` (관리자 탭 활성화 시 AdminLayout 렌더링 연결)
- 유지: `firestore.rules` (3-1단계에서는 Firestore에 문항 저장을 진행하지 않으므로 변경 없음)

### 확인 결과
- 확인함: `npm run build` 통과, `npm run lint` 통과 (0 error, 기존 useAuth 관련 1 warning 유지).
- 확인함(정상 샘플 검증, `exam-sample.json`):
  - 10개 문항 정상 로드 및 오류 0건 판정.
  - 총 문항 수 목표(40문항) 불일치에 대한 안내 경고 1건 적절히 표시.
  - 5개 영역(각 2문항씩 100%), 난이도(하 5, 중 3, 상 2), 정답 번호 분포 정확 집계 확인.
  - `review: true` 2개 문항(4번, 10번)에 '검토' 배지 및 황색 배경 행 강조 표시 확인.
- 확인함(오류 샘플 검증, `exam-error-sample.json`):
  - 오류 6건 즉시 식별 및 문항 번호와 원인 목록화 확인:
    1. 2번 문항 번호 2회 중복
    2. 1번 문항 선택지 3개 (4지선다 위반)
    3. 2번 문항 정답 번호 5 (1~4 범위 초과)
    4. 2번 문항 난이도 '보통' (상/중/하 위반)
    5. 3번 문항 영역 태그 '알고리즘기초' (5대 표준 영역 불일치)
    6. 4번 문항 근거 자료(source) 공백 누락
  - 경고 2건: 문항 수 불일치(6문항) 및 1번과 5번의 핵심 개념 '컴퓨팅 사고의 분해' 중복 경고 확인.
- 확인함(학생 계정 화면 단계 차단):
  - 일반 학생 계정 로그인 상태에서 상단 헤더의 탭 목록에 '관리자' 탭이 아예 노출되지 않음을 브라우저에서 확인.
  - 내부적으로 비관리자 상태에서 AdminLayout 접근 시 '관리자 권한이 필요합니다' 화면 차단 안내 렌더링 확인.
- 확인함(임시 보관 및 비우기):
  - 브라우저 localStorage에 초안 자동 저장, 페이지 새로고침 후에도 유지됨 확인.
  - 상단 안내 띠("초안은 이 브라우저에만 저장됩니다. 공용 PC에서는 작업 후 [초안 비우기]를 눌러 주세요") 표시 확인.
  - `[초안 비우기]` 클릭 시 커스텀 확인 모달이 뜨고, 승인 시 안전하게 초기화됨 확인.
- 확인하지 못함:
  - 3-2단계에서 수행할 실제 Apps Script 및 Firestore로의 정답 분리 저장/점검 완료 전송 동작 (현재 버튼 disabled 상태 유지).
  - 실제 여러 명의 관리자가 동시 접속했을 때의 브라우저별 로컬 초안 독립성 (기기별로 완전히 독립 동작함).

### 최종 확인
- [x] 빌드·린트
- [x] 샘플 검증 (정상 샘플 10문항 통계, 오류 샘플 6건 오류 및 2건 경고 정확 감지)
- [x] 학생 계정 관리자 탭 비노출 확인
- [x] Commit & Push (사용자)

---

## 3-2단계: 문항 확정 및 정답표 분리 저장 (Apps Script & Firestore 격리)

### 프롬프트
```text
@[AGENTS.md] 
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-4-admin.md의 "9-1. 문항 관리", docs/spec-3-exam.md의 "8. 서버 채점과 기록", docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 3단계]의 3-2단계를 진행해 줘.

# 현재 상태
- 3-1단계 완료: 관리자 탭, 문항 JSON 가져오기, 형식 검사, 검토 표, 브라우저 임시 보관. [점검 완료]는 비활성 상태
- 구글 시트 준비됨: 내 드라이브/LearnLoopCS/04 결과/LearnLoopCS_결과 (탭: 응시결과, 정답표, 테스트응시, 익명분석)
- Apps Script는 아직 없음, VITE_GAS_URL은 비어 있음

# 이번 단계 범위 (3-2)
1. Apps Script 코드 (apps-script/Code.gs)
   - 시트에 붙여 쓰는 스크립트(컨테이너 바인딩)로 작성. 시트 주소를 코드에 적지 말 것
   - 이번에는 "문항 확정(정답표 저장)" 기능만 만들고, 채점·기록 함수는 4단계용으로 자리만 둘 것
   - 정답표 탭 열 구조를 제안해 줘 (예: 시험ID, 문항번호, 정답, 영역, 난이도, 해설, 확정 시각, 확정자)
   - 같은 시험을 다시 확정하면 해당 시험ID의 기존 행을 교체
2. 관리자 확인 (Apps Script 쪽)
   - 브라우저는 Firebase 로그인 토큰을 함께 보내고, Apps Script가 토큰을 검증해 이메일을 확인한 뒤 관리자 목록과 대조
   - 관리자 이메일 목록과 필요한 키는 Apps Script 스크립트 속성에만 두고 코드·저장소에 적지 말 것
   - 검증 방법과 한계를 계획에서 먼저 설명해 줘
3. [점검 완료] 활성화
   - 형식 오류가 0건일 때만 누를 수 있고, 확인 모달로 한 번 더 묻기
   - 정답과 해설은 Apps Script를 통해 시트 정답표로만 보냄 (해설도 정답을 드러낼 수 있으므로 학생용 문항에서 제외)
   - 정답·해설을 뺀 문항(번호, 영역, 난이도, 질문, 선택지)만 Firestore에 저장
   - 두 저장의 순서와, 한쪽만 실패했을 때 처리 방법을 계획에서 설명해 줘
   - 확정이 끝나면 브라우저 임시 초안의 정답을 지우고, 확정 상태와 시각을 화면에 표시
4. Firestore 규칙
   - 이번 단계에서 시험 문항은 관리자만 읽고 쓸 수 있게 (학생 읽기 권한은 4단계에서 시험 코드와 함께 추가)
5. 설정 안내 문서 (docs/setup-apps-script.md)
   - 시트에서 Apps Script 열기, 코드 붙여 넣기, 스크립트 속성 등록, 웹 앱 배포(실행 계정·접근 권한 설정), 배포 링크를 .env.local과 Vercel의 VITE_GAS_URL에 등록, 재배포까지 단계별로 작성
   - 처음 하는 사람도 따라 할 수 있게, 화면 메뉴 이름을 그대로 적어 줘

# 계획 승인 및 보완 요청
1. Firestore 구조 분리 (4단계 권한을 위해): exams/{examId} 시험 정보, exams/{examId}/questions/{no} 문항
2. 학생용 문항 필드 최소화: concept와 source 제외, questions 문서는 no, domain, level, question, choices 외 필드 쓰기 거부
3. 시험ID: 확인 모달에서 시험ID 입력 및 수정 가능하게
4. 확정 후 초안 처리: 브라우저 임시 초안 삭제 및 안내 표시
5. Apps Script 통신: Content-Type: text/plain, 토큰 확인 시 emailVerified 검증
6. 문서와 기록: ADMIN_EMAILS 가짜 주소 예시 명시, 과장 표현 지양
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 시험 정보와 문항을 한 문서에 저장해, 4단계에서 시험명만 먼저 보여 주고 문항은 시험 코드 확인 후 공개하는 권한 분리가 불가능 ② 핵심 개념이 학생용 데이터에 포함되어 답의 힌트가 될 수 있음 |
| 수정 요구 | 시험 정보와 문항 문서 분리, 학생용 필드는 번호·영역·난이도·질문·선택지로 최소화, 시험ID 확인 절차, 확정 후 초안 삭제 |
| 판단 근거 | Firestore 권한은 문서 단위로 적용되므로 다음 단계의 공개 시점을 고려해 지금 구조를 정해야 함. 학생에게 보내는 데이터는 풀이에 필요한 것만 둔다 |
| 개선 결과 | ① Firestore 경로를 `exams/{examId}`(메타데이터)와 `exams/{examId}/questions/{no}`(학생용 문항)로 분리하고, 보안 규칙에서 no, domain, level, question, choices 외의 필드(`answer`, `explanation`, `concept`, `source` 등) 포함 시 쓰기를 거부하는 검증 함수를 구현. ② 구글 시트 `[정답표]` 탭에 10개 열(시험ID, 문항번호, 정답, 영역, 난이도, 핵심개념, 출처근거, 해설, 확정시각, 확정자) 구조로 정답과 해설을 보관하는 Apps Script 구현. ③ 확인 모달에서 시험ID 입력/검증, 확정 후 브라우저 임시 초안 삭제 및 안내 표시. ④ Apps Script 호출 시 text/plain 기반 통신 및 Firebase 토큰의 이메일 인증(emailVerified) 검증 적용. ⑤ docs/setup-apps-script.md 가이드 작성 완료. |

### 변경한 파일
- 신규: `apps-script/Code.gs` (시트 컨테이너 바인딩, Google Identity Toolkit 토큰 및 관리자 검증, [정답표] 10개 열 덮어쓰기 저장, 4단계 채점 stub)
- 신규: `docs/setup-apps-script.md` (Apps Script 열기, 코드 복사, 스크립트 속성 등록, 웹 앱 배포, .env.local/Vercel VITE_GAS_URL 등록 단계별 매뉴얼)
- 수정: `firestore.rules` (`validExamInfo`, `validExamQuestion` 검증 함수 및 `exams/{examId}`, `exams/{examId}/questions/{no}` 관리자 보안 규칙 추가)
- 수정: `src/features/admin/types.ts` (`StudentExamQuestion`, `ExamInfo` 타입 추가)
- 신규: `src/features/admin/examFinalizeService.ts` (Apps Script 정답표 저장 후 Firestore 시험정보·문항 분리 저장, 최근 확정 시험 상태 조회)
- 신규: `src/features/admin/FinalizeConfirmModal.tsx` (시험ID 입력 및 검증, 2단계 저장 절차 안내 모달)
- 수정: `src/features/admin/admin.css` (`admin-finalized-banner` 확정 상태 배너 스타일 추가)
- 수정: `src/features/admin/QuestionManager.tsx` ([점검 완료] 활성화, 확정 모달 연결, 확정 완료 후 초안 삭제 및 성공 배너 출력, 마운트 시 최신 확정 시험 상태 로드)
- 수정: `docs/prompt-log.md` (3-2단계 작업 계획, 검토 메모 및 결과 기록)

### 확인 결과
- 확인함: `npm run build` 통과, `npm run lint` 통과 (0 error, 기존 useAuth 관련 1 warning 유지).
- 확인함(Firestore 문항 필드 최소화):
  - 학생용 문항 객체는 `no`, `domain`, `level`, `question`, `choices` 5개 필드만 포함하도록 타입 및 배치 전송 로직 구성.
  - `concept`, `source`, `answer`, `explanation`은 Firestore 저장 페이로드에서 제외됨.
  - `firestore.rules`에서 `keys().hasOnly(['no', 'domain', 'level', 'question', 'choices'])`를 검증하여 그 외의 필드가 포함된 쓰기 요청을 거부하도록 규칙 구성.
- 확인함(점검 완료 버튼 제어):
  - 문항이 없거나 형식 검사 오류가 있을 때는 [점검 완료] 버튼이 비활성화됨.
  - 오류 0건 상태에서만 버튼이 활성화되고, 클릭 시 시험ID 입력 모달이 열림.
  - 확정 후 브라우저 localStorage 초안이 비워지며 안내 문구가 표시됨.
- 확인하지 못함:
  - 사용자가 실제 스프레드시트에 Apps Script를 배포하고 `VITE_GAS_URL`을 설정하기 전이므로, 실제 Apps Script 웹 앱으로의 네트워크 통신 및 구글 시트 행 삽입 동작 (사용자 직접 배포 후 검증 예정).
  - 학생 계정으로 Apps Script 웹 앱을 직접 호출했을 때의 거부 동작 (웹 앱 배포 후 테스트 가능).

### 최종 확인
- [x] 빌드·린트
- [x] Firestore 보안 규칙 및 문항 최소화 로직 반영
- [x] setup-apps-script.md 설정 가이드 작성
- [ ] Apps Script 배포 및 VITE_GAS_URL 등록 (사용자)
- [ ] 정답표 시트 및 Firestore 실제 저장 확인 (사용자)

---

## 3-3 UI 개선: 시험 문항 검토 화면 와이드 레이아웃 및 가로 스크롤 사용성 개선

### 사용자 요청
> 시험문제 검토화면에서 스크롤가로가 바닥에 있어서 너무 불편해.. 화면 UI를 넓게 또는 편리하게 변경해줘

### 변경 내용
1. **관리자 화면 전체 너비 확장**:
   - `src/app/Shell.tsx`: 관리자 탭 활성화 시 `.shell-main-admin` 클래스 부여.
   - `src/app/shell.css`: 기본 1100px 제한에서 관리자 화면은 `max-width: 1680px`, `width: 96%`로 대폭 확장.
2. **사이드바 접기/펼치기 토글**:
   - `src/features/admin/AdminLayout.tsx`: `◀`/`▶` 토글 버튼 추가. 접을 시 사이드바 폭을 240px → 68px로 축소하여 검토 화면 폭 최대 확보.
3. **가로 스크롤 사용성 전면 개선 (테이블 뷰)**:
   - `src/features/admin/QuestionTable.tsx`, `admin.css`:
     - 뷰포트 고정 내부 스크롤 컨테이너(`max-height: calc(100vh - 280px)`): 40문항 전체를 스크롤하지 않아도 **현재 화면 하단에 가로 스크롤바가 항상 노출**.
     - `thead` 상단 고정(`sticky top: 0`): 40문항을 아래로 내려도 열 헤더 유지.
     - 좌측 번호 열 고정(`sticky left: 0`): 우측으로 가로 스크롤해도 문항 번호가 항상 좌측에 고정.
     - 상단 동기화 가로 스크롤바 및 빠른 이동 버튼(`◀ 번호·질문`, `🎯 선택지·정답`, `해설·수정 ▶`): 표 상단에서도 즉시 원하는 위치로 가로 점프 가능.
4. **가로 스크롤 없는 [🗂️ 카드형 뷰] 모드 추가**:
   - 상단 툴바에서 `[📋 테이블 뷰]`와 `[🗂️ 카드형 뷰]`를 즉시 전환 가능.
   - 카드형 뷰에서는 가로 스크롤 없이 각 문항의 질문, 4개 선택지(정답 초록 배지 강조), 근거 자료, 해설, 수정 버튼이 한눈에 들어오는 시험지 카드 형태로 표시.
5. **영역 필터 칩 및 문항 바로가기**:
   - 영역별 필터 칩(전체, 기초 ICT, 하드웨어 등), [검토 대상만], [오류만] 필터, 특정 문항 점프 셀렉트 추가.

### 변경한 파일
- `src/app/Shell.tsx`
- `src/app/shell.css`
- `src/features/admin/AdminLayout.tsx`
- `src/features/admin/QuestionTable.tsx`
- `src/features/admin/admin.css`
- `docs/prompt-log.md`

---

## 4-1단계: 시험 운영 메뉴, 시험 코드·세션 보안 검증 및 학생 시험 탭 UI (2026-10-17)

### 보낸 프롬프트 1 (계획 요청)
```text
@[AGENTS.md] 
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-3-exam.md의 "7. 시험 탭"과 "8. 서버 채점과 기록", docs/spec-4-admin.md의 "9-2. 시험 운영", docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 4단계]를 둘로 나눠 이번에는 4-1단계만 진행해 줘.

# 현재 상태
- 3단계 완료: 문항 확정 시 정답·해설은 시트 정답표, 학생용 문항(no, domain, level, question, choices)은 Firestore exams/{examId}/questions/{no}에 저장
- exams/{examId}에는 시험 정보(status: finalized)만 있고, 지금은 관리자만 읽을 수 있음
- 실제 시험 ID: midterm-2026 (40문항)

# 이번 단계 범위 (4-1)
1. 관리자: 시험 운영 메뉴 최소 기능
   - 확정된 시험에 대해 시험 일시, 제한시간(기본 50분), 시험 코드(자동 생성·재발급) 설정
   - [시험 열기] / [시험 닫기] 상태 전환 (확정 전에는 열기 비활성)
   - 실시간 응시 현황, 학생별 남은 시간은 5단계에서 함. 이번에는 만들지 말 것
2. 시험 코드 보관과 확인
   - 시험 코드는 학생이 읽을 수 없는 관리자 전용 문서에 보관 (예: exams/{examId}/private/config)
   - 학생이 코드를 입력하면 응시 세션 문서(예: exams/{examId}/sessions/{uid})를 만들고, 보안 규칙에서 코드 일치와 시험 열림 상태를 확인
   - 규칙의 get()으로 관리자 전용 문서를 대조하는 방식을 검토해 주고, 다른 방법이 낫다면 이유와 함께 제안
3. 입장 시각과 타이머
   - 세션 생성 시 입장 시각은 서버 시각(request.time)으로 기록하고 규칙에서 강제
   - 종료 시각 = 입장 시각 + 제한시간. 새로고침하거나 탭이 비활성화되어도 바뀌지 않게
4. 학생 시험 탭 (spec 7의 화면 그대로)
   - 상태별 화면: 준비 중(잠금, 시험명·일시) / 시험 열림(코드 입력 → 응시 안내·동의 → 시험지) / 제출 완료는 4-2단계
   - 시험 정보(시험명, 일시, 제한시간, 문항 수)는 로그인한 학생이 읽을 수 있게, 문항은 세션이 있는 학생만 읽을 수 있게
   - 시험지: 헤더 카드, 상단 고정 바(남은 시간, 진행 상태), 문항 카드, 선택 상태, 깃발 표시
   - OMR 네비게이션: 넓은 화면은 오른쪽 고정, 모바일은 하단 [답안 현황] 시트
   - 종료 경고(5분 전, 1분 전), 마지막 1분 깜빡임
   - 미답변 확인 모달과 [문제 풀러가기] / [그대로 제출하기]
   - 질문에 줄바꿈(\n)이 있으면 줄을 나눠 표시
   - 응시 중 선택한 답은 새로고침해도 유지되도록 브라우저에 임시 보관
5. 응시 안내·동의 화면
   - 제한시간, 문항 수, 제출 후 수정 불가, 기록되는 항목을 안내
   - 탭 이탈 기록과 카메라 기능은 6단계에서 만들 예정이므로, 이번에는 안내 문구 자리만 두고 "준비 중"으로 표시
6. [시험지 최종 제출하기]
   - 4-2단계에서 서버 채점과 연결할 예정. 이번에는 미답변 확인까지 동작하고, 실제 전송은 하지 않고 "제출 기능은 다음 단계에서 연결됩니다" 안내만 표시

# 하지 말 것
- 정답을 브라우저, Firestore, 저장소에 넣지 말 것
- Apps Script 채점, 시트 기록, 접수 확인 화면은 4-2단계
- 학생 화면 확인은 로그인이 필요하므로 에이전트가 브라우저로 직접 확인하지 말고, 내가 확인할 항목을 목록으로 줄 것

# 끝나면 보고할 것
- 바뀐 파일 목록과 firestore.rules 변경 내용 (내가 Firebase 콘솔에 직접 게시해야 하는지 알려 줘)
- Firestore 구조 (시험 정보, 비공개 설정, 세션, 문항)와 각각 누가 읽고 쓸 수 있는지 표
- 내가 관리자 계정과 학생 계정으로 직접 확인할 항목 목록 (틀린 코드 입력, 새로고침 후 타이머 유지 포함)
- 직접 확인하지 못한 항목은 따로 구분

# 기록
- docs/prompt-log.md에 4-1단계 기록 추가 (프롬프트 원문, 변경 파일, 확인 결과, 계획 검토 메모 자리)
```

### 보낸 프롬프트 2 (계획 승인 및 추가 요구사항)
```text
계획 승인합니다. 다만 아래를 반영해서 진행해 줘.

1. 관리자 이메일 노출 방지
   - exams/{examId}는 로그인한 학생이 읽을 수 있으므로 finalizedBy(관리자 이메일)를 private/config로 옮길 것
   - Firestore는 문서 단위로 읽기 권한이 적용되어 일부 필드만 숨길 수 없음. 학생이 읽는 문서에는 공개해도 되는 필드만 둘 것
   - validExamInfo의 허용 필드 목록도 새 구조(examDate, durationMinutes, closeAt 등)에 맞게 수정
2. 세션의 학생 정보 검증
   - 세션 생성 시 studentId, name, section이 students/{uid} 문서의 값과 같은지 규칙에서 get()으로 확인
   - 학생 등록(students/{uid})이 없는 계정은 세션 생성 불가
3. 시험 마감 시각
   - 관리자가 시험 일시와 제한시간을 정하면 시험 마감 시각(closeAt = 시험 시작 시각 + 제한시간 + 여유 시간, 여유 시간 기본 10분, 관리자가 수정 가능)을 함께 저장
   - 개인 종료 시각 = min(입장 시각 + 제한시간, closeAt)
   - 동의 화면에 "늦게 입장하면 남은 시간만 응시할 수 있습니다" 안내
4. 문항 읽기 조건 강화
   - 세션이 있고, 시험 상태가 open이고, 현재 서버 시각이 개인 종료 시각 전일 때만 문항 읽기 허용
   - 시간이 끝나면 시험지 화면은 잠기고 문항을 다시 불러오지 않음
5. 표현
   - 보고와 기록에 "완벽한", "원천 차단", "절대" 같은 과장 표현은 쓰지 말 것

prompt-log의 4-1단계 기록에 아래 계획 검토 메모를 문구 그대로 넣어 줘.

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 학생이 읽는 시험 정보 문서에 관리자 이메일(finalizedBy)이 포함됨 ② 세션의 학번·성명을 학생 브라우저가 그대로 기록해 위조 가능 ③ 늦게 입장한 학생도 제한시간 전체를 받아 수업 시간 이후까지 응시 가능 ④ 시험 종료 후에도 세션만 있으면 문항 열람 가능 |
| 수정 요구 | 관리자 정보는 비공개 문서로 이동, 세션 정보를 학생 등록 문서와 대조, 시험 마감 시각 도입(개인 종료 = min(입장+제한시간, 마감)), 문항 읽기에 시험 상태와 시간 조건 추가 |
| 판단 근거 | 보안 규칙은 문서 단위로 동작하므로 공개 문서에는 공개 가능한 값만 둔다. 시험은 모든 학생에게 같은 조건이어야 하며, 기술적으로 가능한 것보다 실제 시험 운영 규칙을 기준으로 시간과 권한을 정한다 |
| 개선 결과 | (작업 후 확인 결과) |
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 학생이 읽는 시험 정보 문서에 관리자 이메일(finalizedBy)이 포함됨 ② 세션의 학번·성명을 학생 브라우저가 그대로 기록해 위조 가능 ③ 늦게 입장한 학생도 제한시간 전체를 받아 수업 시간 이후까지 응시 가능 ④ 시험 종료 후에도 세션만 있으면 문항 열람 가능 |
| 수정 요구 | 관리자 정보는 비공개 문서로 이동, 세션 정보를 학생 등록 문서와 대조, 시험 마감 시각 도입(개인 종료 = min(입장+제한시간, 마감)), 문항 읽기에 시험 상태와 시간 조건 추가 |
| 판단 근거 | 보안 규칙은 문서 단위로 동작하므로 공개 문서에는 공개 가능한 값만 둔다. 시험은 모든 학생에게 같은 조건이어야 하며, 기술적으로 가능한 것보다 실제 시험 운영 규칙을 기준으로 시간과 권한을 정한다 |
| 개선 결과 | ① `finalizedBy` 관리자 이메일을 `exams/{examId}`에서 제거하고 `exams/{examId}/private/config`로 분리 저장하여 학생 공개 문서에서 관리자 개인정보 노출 배제. ② 세션 생성 시 Firestore 보안 규칙에서 `get(/students/$(uid))`를 호출하여 `studentId`, `name`, `section`이 학생 등록 문서와 정확히 일치하는지 대조하고 `students/{uid}` 문서가 없는 계정의 세션 생성을 거부. ③ 시험 마감 시각(`closeAt = startAt + durationMinutes + bufferMinutes`)을 도입하고 세션 생성 시 개인 종료 시각을 `min(enteredAt + duration, closeAt)`으로 산출 및 동의 화면에 늦은 입장 시 잔여 시간 응시 안내문 배치. ④ `exams/{examId}/questions/{no}` 읽기 보안 규칙에 세션 존재 여부뿐 아니라 `status == 'open'`, `request.time <= individualEndAt`, `request.time <= closeAt` 조건을 추가하여 시험 종료 시 문항 열람이 제한되도록 구현. |

### 변경한 파일
- 수정: `firestore.rules` (`validExamInfo` 관리자 이메일 제외 및 운영 필드 허용, `validExamSession` 학생 문서 대조, `exams/{examId}` 공개 읽기 허용, `private/config` 관리자 전용 격리, `sessions/{uid}` 코드 대조·상태 확인 및 서버시각 강제, `questions/{no}` 세션 및 종료 시각 조건부 읽기 허용)
- 수정: `src/features/admin/types.ts` (`ExamInfo` 필드 수정, `ExamPrivateConfig`, `ExamSession` 인터페이스 추가)
- 수정: `src/features/admin/examFinalizeService.ts` (`finalizedBy`를 `exams/{examId}/private/config`로 분리 저장)
- 신규: `src/features/admin/examOperationService.ts` (시험 일시, 제한시간, 여유시간, 마감시각, 6자리 시험코드 자동생성/저장 및 열기/닫기 상태 전환 서비스)
- 신규: `src/features/admin/ExamOperation.tsx` (관리자 시험 운영 컴포넌트: 상태 제어 카드, 시험 일시·제한시간·마감시각·시험코드 발급 폼, 커스텀 확인 모달)
- 수정: `src/features/admin/AdminLayout.tsx` (시험 운영 메뉴 활성화 및 `ExamOperation` 연동)
- 수정: `src/features/admin/admin.css` (`ExamOperation` 반응형 레이아웃 및 폼 스타일)
- 신규: `src/features/exam/types.ts` (시험 탭 상태, 타이머 상태, 답안/깃발 타입 정의)
- 신규: `src/features/exam/examStorage.ts` (localStorage 기반 학생별 답안 및 깃발 임시 보관/복원 유틸)
- 신규: `src/features/exam/examService.ts` (Firestore 연동: 시험 정보 조회, 세션 조회/생성, 개인 종료시각 계산, 문항 목록 조회)
- 신규: `src/features/exam/useExamTimer.ts` (개인 종료 시각 기반 카운트다운, 5분 전/1분 전 경고, 만료 콜백 훅)
- 신규: `src/features/exam/ExamLockedView.tsx` (준비 중/마감됨 자물쇠 화면, 시험 일시/제한시간 카드)
- 신규: `src/features/exam/ExamAccessCodeView.tsx` (6자리 시험 코드 입력 폼, 에러 안내)
- 신규: `src/features/exam/ExamConsentView.tsx` (응시 서약, 인적사항 확인, 마감시각·늦은입장 안내, 6단계 보조기능 준비 중 표시, 동의 체크)
- 신규: `src/features/exam/ExamQuestionCard.tsx` (질문 `\n` 줄바꿈 지원, 배점 태그, 4지선다 버튼, 깃발 토글, 미답변 맥동 강조)
- 신규: `src/features/exam/ExamOmrNav.tsx` (데스크톱 고정 OMR 패널, 모바일 바텀시트, 문항 스크롤 바로가기)
- 신규: `src/features/exam/ExamSubmitModal.tsx` (미답변 문항 검색 및 빨간 배지 나열, [문제 풀러가기]/[그대로 제출하기], 4-2단계 안내 모달)
- 신규: `src/features/exam/ExamPaperView.tsx` (시험지 본 화면: 상단 고정 바, 헤더 카드, 문항 목록, OMR 패널, 최종 제출 영역)
- 신규: `src/features/exam/ExamView.tsx` (최상위 시험 탭 상태 머신: loading → locked | code_entry → consent → paper)
- 신규: `src/features/exam/exam.css` (Navy, Gold, Select, Warning, Danger 디자인 시스템 기반 시험 전용 스타일시트)
- 수정: `src/app/Shell.tsx` (`ExamView` 렌더링 연결 및 `.shell-main-exam` 클래스 부여)
- 수정: `src/app/shell.css` (`.shell-main-exam` 와이드 레이아웃 스타일 추가)

### 확인 결과
- 확인함: `npm run build` 통과 (0 error).
- 확인함: `npm run lint` 통과 (0 error, 기존 경고 유지).
- 확인하지 못함:
  - 학생 화면 확인 및 Firestore 보안 규칙 적용은 로그인이 필요하고 원격 Firebase 콘솔에 `firestore.rules`를 게시해야 하므로, 에이전트 브라우저로 직접 테스트하지 않고 사용자가 직접 확인할 항목 목록으로 작성함.

---

### 4-1 추가 수정: OMR 네비게이션 스크롤다운(Sticky) 동작 수리 및 학생용 접수 확인 화면 적용 (2026-10-17)
- **OMR 표 스크롤다운(Sticky) 수리**:
  - `src/index.css`: `html, body`의 `overflow-x: hidden`이 브라우저의 `position: sticky`를 무효화하는 문제를 해결하기 위해 `overflow-x: clip`으로 교체.
  - `src/features/exam/exam.css`: 상단 헤더 높이를 감안하여 `.exam-sticky-bar`는 `top: 60px`, `.exam-omr-desktop`은 `top: 130px; align-self: flex-start; max-height: calc(100vh - 150px)`로 설정. 문제를 아래로 스크롤할 때 OMR 표가 뷰포트 우측에 자연스럽게 고정되어 계속 따라오도록 수정.
- **학생용 접수 확인 화면(`ExamReceiptView.tsx`) 적용**:
  - 미답변 확인 후 [최종 제출] 시 "다음 단계 예고"라는 내부 개발 알림 팝업을 전면 제거.
  - `docs/spec-3-exam.md` 7의 접수 확인 명세 그대로, 시험지를 숨기고 큰 초록 체크 원, Navy→Blue→Gold 그라데이션 선, 응시 과목·시험명·일시·제출 학생·제출 시각·`제출 완료 (수정 불가)` 배지 및 점수 미표시 안내가 들어간 정식 접수 확인 카드로 전환되도록 구현.
  - 새로고침 시에도 제출 이력이 유지되어 시험지가 다시 열리지 않고 접수 확인 화면이 유지됨 확인.

---

## 4-2단계: 학생 답안 제출, 서버 채점과 시트 기록, 접수 확인 (2026-10-17)

### 보낸 프롬프트 1 (계획 요청)
```text
@[AGENTS.md] 
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-3-exam.md의 "미답변 확인과 제출", "접수 확인 화면", "8. 서버 채점과 기록", docs/setup-apps-script.md, docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 4단계]의 4-2단계를 진행해 줘.

# 현재 상태
- 4-1 완료: 시험 열기·코드, 세션(입장 시각은 서버 시각), 개인 종료 시각 = min(입장 시각 + 제한시간, closeAt), 시험지·OMR·타이머·미답변 모달
- [그대로 제출하기]는 아직 안내만 표시
- Apps Script는 문항 확정(정답표 저장)만 동작, 채점 함수는 자리만 있음

# 이번 단계 범위 (4-2)
1. 학생 제출
   - 브라우저는 로그인 토큰, 시험ID, 답안(문항 번호별 선택 번호 또는 미응답), 제출 방식(직접/자동)만 Apps Script로 전송 (Content-Type: text/plain)
   - 전송 전 답안을 브라우저에 보관하고, 실패하면 자동 재전송. 서버의 저장 성공 응답을 받기 전에는 접수 완료로 표시하지 않음
   - 제출 중에는 "답안을 제출하고 있습니다" 로딩 모달, 실패가 계속되면 "답안은 이 기기에 보관되어 있습니다. 인터넷 연결을 확인해 주세요" 안내
   - 개인 종료 시각이 되면 선택한 답안을 자동 제출하고 시험지 잠금
2. Apps Script 채점과 기록
   - 토큰을 검증해 학생을 확인하고, 학번·성명·분반·입장 시각은 브라우저가 보낸 값이 아니라 Firestore 세션 문서에서 읽을 것 (학생 토큰으로 Firestore REST 읽기 등 방법 제안)
   - 서버 시각 기준으로 개인 종료 시각을 다시 계산하고, 네트워크 지연을 고려한 여유(예: 2분)를 넘긴 제출은 "지연 제출"로 표시
   - 정답표와 대조해 채점: 총점(문항당 2.5점), 정답 수, 영역별 점수, 문항별 정오
   - 응시결과 탭에 응시마다 한 행 추가. 열 구조를 계획에서 제안해 줘 (탭 이탈·카메라 기록 열은 6단계용으로 자리만)
   - 같은 학생이 같은 시험을 두 번 제출하지 못하게 하되, 재전송 때문에 같은 요청이 다시 오면 오류가 아니라 처음 접수 결과를 그대로 돌려줄 것
   - 동시에 여러 학생이 제출해도 행이 섞이지 않게 잠금(LockService) 사용
   - 응답에는 접수 번호와 제출 시각만 담고 점수는 보내지 않음
3. 제출 후 상태
   - 접수가 확인되면 다시 시험지에 들어가거나 문항을 읽을 수 없게 할 것 (Firestore 규칙과 화면 모두)
   - 새로고침해도 접수 확인 화면이 보이게
4. 접수 확인 화면 (spec 그대로)
   - 초록 체크 원, 그라데이션 선, 응시 과목·시험 일시·제출 학생·제출 시각·"제출 완료 (수정 불가)" 배지
   - 점수는 표시하지 않고 "성적은 교수자가 공개한 뒤 시험 탭에서 확인할 수 있습니다" 안내
5. 설정 문서
   - Code.gs 수정 후 같은 주소를 유지하는 재배포 방법(배포 관리 → 편집 → 새 버전)을 docs/setup-apps-script.md에 추가

# 하지 말 것
- 정답과 점수를 학생 브라우저로 보내지 말 것
- 익명분석 탭, 테스트응시, 성적 공개, 응시 현황은 5단계
- 로그인이 필요한 화면은 에이전트가 브라우저로 직접 확인하지 말고, 내가 확인할 항목을 목록으로 줄 것
- 보고와 기록에 과장 표현 쓰지 말 것

# 끝나면 보고할 것
- 바뀐 파일 목록, firestore.rules 변경 여부, Code.gs 재배포 필요 여부
- 응시결과 탭 열 구조와 실제 기록 예시
- 내가 직접 확인할 항목 (정상 제출, 미응답 포함 제출, 인터넷 끊고 제출 후 재연결, 두 번 제출 시도, 시간 종료 자동 제출, 접수 후 새로고침)
- 직접 확인하지 못한 항목은 따로 구분

# 기록
- docs/prompt-log.md에 4-2단계 기록 추가 (프롬프트 원문, 변경 파일, 확인 결과, 계획 검토 메모 자리)
```

### 보낸 프롬프트 2 (계획 승인 및 추가 요구사항)
```text
계획 승인합니다. 아래 두 가지만 반영해 줘.

1. 응시결과에 시험ID 열을 추가하고, 중복 확인은 시험ID + UID로 할 것. 접수 번호도 날짜 대신 시험ID 기반으로 (예: REC-midterm-2026-학번)
2. 잠금 안에서는 중복 확인과 행 추가만 하고, 토큰 확인·세션 읽기·채점은 잠금 밖에서 처리할 것 (종료 시각에 제출이 몰릴 때 대기 시간을 줄이기 위해)

지연 제출은 교수 확인용 표시로만 기록하고, 보고와 기록에 과장 표현은 쓰지 말 것.

prompt-log의 4-2단계 기록에 아래 계획 검토 메모를 문구 그대로 넣어 줘.

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 응시결과에 시험ID 열이 없어 여러 시험 구분과 중복 확인이 어려움 ② 잠금 안에서 외부 호출과 채점까지 처리해 종료 시각에 제출이 몰리면 대기가 길어질 수 있음 |
| 수정 요구 | 시험ID 열 추가와 시험ID 기반 접수 번호, 잠금 범위를 중복 확인과 행 추가로 축소 |
| 판단 근거 | 과제 시연과 실제 운영의 핵심 흐름에 꼭 필요한 부분만 반영하고, 드문 예외 상황은 범위에서 제외함 |
| 향후 개선 과제 | 실제 운영 시 고려할 점: 시트 기록 후 접수 표시 생성 실패 시 복구, 네트워크 지연으로 늦게 도착한 제출의 판단 기준 |
| 개선 결과 | (작업 후 확인 결과) |
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 응시결과에 시험ID 열이 없어 여러 시험 구분과 중복 확인이 어려움 ② 잠금 안에서 외부 호출과 채점까지 처리해 종료 시각에 제출이 몰리면 대기가 길어질 수 있음 |
| 수정 요구 | 시험ID 열 추가와 시험ID 기반 접수 번호, 잠금 범위를 중복 확인과 행 추가로 축소 |
| 판단 근거 | 과제 시연과 실제 운영의 핵심 흐름에 꼭 필요한 부분만 반영하고, 드문 예외 상황은 범위에서 제외함 |
| 향후 개선 과제 | 실제 운영 시 고려할 점: 시트 기록 후 접수 표시 생성 실패 시 복구, 네트워크 지연으로 늦게 도착한 제출의 판단 기준 |
| 개선 결과 | ① `[응시결과]` 시트에 1열 `시험ID`를 추가하고, 중복 제출 검사를 `시험ID + UID` 조합으로 수행하며 접수 번호도 `REC-{examId}-{studentId}` 형태로 체계화함. ② `LockService` 잠금 내부에서는 오직 시트 중복 확인과 행 추가(appendRow)만 처리하도록 분리하고, 토큰 검증·Firestore REST 세션 읽기·채점 계산은 잠금 외부에서 사전 처리하여 동시 제출 시 병목 대기 시간을 최소화함. |

### 변경한 파일
- 수정: `firestore.rules` (`validExamSubmission` 접수 문서 검증 함수 추가, `match /submissions/{uid}` 본인 1회 생성 및 수정/삭제 차단 규칙 추가, `match /questions/{no}` 읽기 조건에 `!exists(submissions/{uid})` 추가하여 답안 제출 완료 학생의 문항 열람 차단)
- 수정: `apps-script/Code.gs` (`submitExam` 완성: 토큰 검증, Firestore REST API 세션 문서 조회, 서버 시각 기반 지연 제출 판정, 정답표 대조 채점, 총점·영역별 성취도 산출, LockService 기반 중복 검사 및 59개 열 행 추가, Firestore REST 접수 완료 문서 기록 연동, 접수 번호 및 시각 응답)
- 수정: `src/features/exam/types.ts` (`ExamSubmissionPayload`, `ExamSubmissionResponse`, `ExamReceiptData` 인터페이스 추가)
- 수정: `src/features/exam/examStorage.ts` (`saveReceipt`, `loadReceipt`, `savePendingSubmission`, `loadPendingSubmission`, `clearPendingSubmission` 추가)
- 수정: `src/features/exam/examService.ts` (`fetchExamSubmission`, `recordExamSubmission`, `submitExamToGas` 지수 백오프 자동 재전송 함수 구현)
- 수정: `src/features/exam/ExamPaperView.tsx` (서버 제출 연동, 타이머 종료 시 자동 제출, 제출 중 로딩 스피너 모달, 네트워크 오류 시 로컬 보관 안내 및 재시도 모달 연동)
- 수정: `src/features/exam/ExamReceiptView.tsx` (`receiptId` 접수 번호 표기 행 추가)
- 수정: `src/features/exam/ExamView.tsx` (Firestore 원격 접수 이력 및 로컬 접수 영수증 감지, 새로고침 시에도 접수 확인 화면 유지, 문항 재로딩 차단)
- 수정: `docs/setup-apps-script.md` (Code.gs 코드 수정 후 동일 웹 앱 URL을 유지하는 [배포 관리] → [편집] → [새 버전] 재배포 가이드 추가)

### 4-2 추가 수정: 정답표 1행 제목줄 점검 및 중복 행 교체·검증 강화, 실행 로그 가이드 추가 (2026-10-18)
- **정답표·응시결과 시트 제목줄 점검 (`ensureAnswerKeySheet`, `ensureSubmissionsSheet`)**:
  - 시트에 데이터가 없으면 1행에 제목줄을 작성하고, 1행이 제목줄('시험ID')이 아니면 데이터를 아래로 밀지 않고 경고(`Logger.log`)를 남김.
- **같은 시험ID 재확정 시 모든 행 교체 (`finalizeExam`)**:
  - 기존 2행부터 검사하던 방식에서 1행부터 검사하도록 수정하여, 1행에 남아 있던 구버전 데이터 행도 삭제 및 교체 대상에 포함(단, 1행이 제목줄 '시험ID'인 경우는 보존).
  - 전체 삭제 후 시트에 제목줄이 없으면 1행에 제목줄을 신규 작성한 뒤 문항 데이터 행들을 추가하여 중복 방지.
- **채점 시 중복 문항 번호 검증 (`getAnswerKeyMap`)**:
  - 정답표를 파싱할 때 동일 문항 번호가 2번 이상 나타나면 즉시 채점을 중단하고 `"정답표 중복 오류: [시험ID] 정답표에 중복된 문항 번호가 존재합니다 (...번)"` 에러를 반환.
- **제출 및 서버 오류 시 Apps Script [실행] 로그 확인 방법 문서화**:
  - `docs/setup-apps-script.md` 4-2절에 스프레드시트의 Apps Script [실행](Executions) 메뉴에서 `doPost` 실패 원인 및 로그 확인 방법 추가.
- **세션 지속성(`browserSessionPersistence`) 및 제출 완료 가드 보강**:
  - `src/lib/auth.tsx`에 세션 지속성을 적용하여 브라우저 종료 후 재접속 시 로그인 첫 화면 시작 보장.
  - `src/features/exam/ExamView.tsx`에서 제출 완료 상태(`submitted`)일 때 시험지가 노출되지 않도록 영수증 화면 렌더링 가드 강화.

---

## 4-3단계: 4단계 마무리 점검 및 타이머 서버 시각 동기화 (2026-10-18)

### 보낸 프롬프트 1 (점검 요청)
```text
먼저 점검 결과만 보고하고, 수정이 필요하면 계획을 보여 준 뒤 내가 승인하면 진행해 줘.
docs/spec-3-exam.md의 "8. 서버 채점과 기록", docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 4-3단계(4단계 마무리 점검)를 진행해 줘.

# 현재 상태
- 4-1 완료: 시험 운영(열기·닫기, 시험 코드, 서버 시각), 학생 입장·시험지·OMR·타이머
- 4-2 완료: 제출 → Apps Script 채점 → 응시결과 시트 기록, 제출 후 홈 이동
- 학생 응시 자격 오류 수정 완료 (시험 open 상태에서 학생 응시 가능)

# 이번 단계 범위 (4-3)
아래 세 가지가 "화면에서만"이 아니라 서버 기준으로 지켜지는지 코드로 점검한다.

1. 채점 정확성
   - 학생 답안, Firestore 학생용 문항, 시트 정답표가 각각 선택지 번호를 몇부터 세는지(0부터인지 1부터인지) 확인하고, 채점할 때 같은 기준으로 비교하는지
   - 미응답 문항이 오답으로 처리되는지, 시트에 어떤 값으로 기록되는지
   - 점수 계산(문항당 2.5점)과 틀린 문항 번호 목록이 맞는지
2. 재응시 차단
   - 제출 여부를 브라우저 상태가 아니라 Firestore 제출 기록 또는 Apps Script 기준으로 판정하는지
   - 새로고침, 로그아웃 후 재로그인, 다른 브라우저에서 다시 들어와도 막히는지
   - 같은 학생의 제출이 두 번 들어오면 Apps Script가 두 번째를 거부하는지
3. 시간 종료 자동 제출
   - 타이머가 서버 시각 기준인지 (학생 PC 시계를 바꿔도 영향이 없는지)
   - 시간이 끝나면 마킹한 답안까지 자동 제출되는지
   - 자동 제출이 네트워크 오류로 실패하면 어떻게 되는지

# 하지 말 것
- 점검 단계에서는 코드를 바로 고치지 말 것 (보고 → 내 승인 → 수정)
- 문제가 없는 기능은 리팩터링하지 말 것

# 끝나면 보고할 것
- 항목별로 "통과 / 문제 있음 / 코드로 확인 불가"와 근거(파일·줄)
- 문제가 있으면 원인과 최소 수정 계획
- 내가 브라우저에서 직접 해 볼 테스트 순서
  (테스트 학생 2명 기준: A는 1~3번만 틀리게 제출, B는 제한시간 3분으로 시간 종료)
- 테스트 후 시트에서 확인할 값
  (A: 92.5점, 틀린 문항 1, 2, 3 / B: 미응답 문항이 기록되는 방식)

# 기록
- docs/prompt-log.md에 4-3단계 기록 추가 (프롬프트 원문, 점검 결과, 수정 내용, 직접 테스트 결과 자리)
```

### 보낸 프롬프트 2 (계획 1차 피드백 및 조건부 승인)
```text
점검 결과 확인했어. 통과 항목은 그대로 두고, 타이머 수정은 아래 조건으로 승인할게.

1. 마감 시각(individualEndAt)은 학생 PC의 Date.now()로 계산하지 말 것
   - 입장 시각은 serverTimestamp()로 기록하고, firestore.rules에서 request.time과 일치하는지 검사
   - 마감 시각 = min(입장 시각 + 제한시간, closeAt)을 서버 시각 기준으로 정하고,
     규칙에서 이 값이 맞는지 검사하는 방법을 계획에 구체적으로 적어 줘
   - 지금 규칙이 individualEndAt을 검사하고 있는지도 먼저 알려 줘
2. useExamTimer는 화면을 열 때마다(새로고침 포함) 서버 시각을 한 번 받아
   남은 시간을 계산하고, 그 뒤 경과 시간만 performance.now()로 잴 것
   - 서버 시각을 어디서 받아 올지(Firestore 또는 Apps Script) 제안해 줘
3. 최종 판정은 지금처럼 Apps Script 서버 시각 기준 '지연 제출' 기록을 유지할 것
4. submissions/{uid} 문서를 누가 만드는지(학생 브라우저 / Apps Script) 알려 줘. 수정은 하지 말 것

수정 전에 바뀐 계획을 다시 보여 주고, firestore.rules가 바뀌면 배포 명령을 안내해 줘.
```

### 보낸 프롬프트 3 (계획 2차 피드백 및 A안 최종 승인)
```text
계획 확인했어. Q1에서 확인된 문제는 꼭 고쳐야 하지만, 지금 계획에는 문제가 하나 있어.

1. individualEndAt == request.time + 제한시간 처럼 "정확히 일치"를 검사하면
   브라우저가 request.time을 밀리초까지 미리 알 수 없어서 정상 학생도 세션 생성이 거부될 거야.
   아래 두 방법을 비교하고, 추천안과 이유, 바뀌는 파일 목록을 알려 줘.
   - A안: 세션에 individualEndAt을 저장하지 않고 enteredAt(서버 시각)만 기준으로 두기.
     화면 타이머와 Apps Script 지연 제출 판정은 min(enteredAt + 제한시간, closeAt)으로 계산
   - B안: 규칙에서 기대 마감 시각보다 늦지 않고, 일정 초 이내로 이른 값만 허용
2. 서버 시각을 Apps Script에서 받아 오지 못하면(시간 초과·네트워크 오류) 어떻게 할지 정해 줘.
   타이머가 멈추거나 시험지가 안 열리면 안 되고, 최종 판정은 Apps Script 지연 제출 기록이 맡는다는 전제로 제안해 줘.
3. 학생이 submissions/{uid} 문서를 수정·삭제할 수 없는지 firestore.rules에서 확인해서 알려 줘. 수정은 하지 말 것.
4. 기록과 보고에 "원천 거부"처럼 과장된 표현은 쓰지 말 것.

선택한 안으로 수정한 뒤, 학생 계정으로 세션 생성이 실제로 성공하는지 확인할 방법도 알려 줘.
```

### 보낸 프롬프트 4 (추가 요구사항 및 배포 지침)
```text
A안으로 승인할게. 아래 두 가지만 함께 반영해 줘.

1. A안에서는 마감 시각을 현재 제한시간으로 계산하므로, 시험 중 제한시간을 바꾸면
   응시 중인 학생 모두의 마감이 바뀌어. 시험 status가 open인 동안에는
   제한시간과 closeAt을 수정할 수 없게 해 줘 (관리자 화면에서 입력을 막고,
   firestore.rules에서도 open 상태의 해당 필드 변경을 거부).
2. 서버 시각 조회에 실패해 PC 시계로 대신 시작한 경우, 시험 중 30초 간격으로
   최대 3번 다시 시도해서 성공하면 남은 시간을 서버 기준으로 다시 맞춰 줘.

Apps Script도 같은 공식(min(enteredAt + 제한시간, closeAt))으로 계산하는지,
제한시간과 closeAt을 어디서 읽는지 보고해 줘.

# 배포 (수정이 끝나면 직접 실행)
1. firestore.rules를 바꿨다면 firebase deploy --only firestore:rules를 실행하고
   출력에 "Deploy complete!"가 있는지 확인해 줘.
2. Code.gs를 바꿨다면 clasp로 배포해 줘.
   - clasp push로 업로드
   - clasp deployments로 기존 웹앱 배포 ID를 확인
   - clasp deploy -i <기존 배포ID> -d "4-3 서버 시각 기준 마감"으로 같은 URL에 새 버전 배포
   - 반드시 -i로 기존 배포를 갱신할 것. 새 배포를 만들면 웹앱 URL이 바뀌어 VITE_GAS_URL이 깨짐
3. 실행 결과를 그대로 보고해 줘.
   - 로그인 만료, clasp 미설정(.clasp.json 없음), 권한 오류 등으로 실패하면
     임의로 우회하거나 새로 설정하지 말고, 오류 내용과 내가 할 일을 알려 줘
   - 배포 ID나 토큰 같은 값은 보고와 prompt-log에 적지 말 것
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | 타이머 마감 시각과 남은 시간이 학생 PC 시계 기준으로 계산됨. 1차 수정 계획(performance.now)은 새로고침 시 다시 PC 시계를 참조해 조작 가능 |
| 수정 요구 | 입장·마감 시각을 서버 시각으로 기록하고 규칙으로 검사, 화면을 열 때마다 서버 시각 기준으로 남은 시간 계산 |
| 판단 근거 | 4-1에서 정한 "입장 시각은 서버 시각" 원칙과 일치시키고, 화면 타이머가 아닌 서버 기록이 공정성의 기준이 되어야 함 |
| 2차 검토 | 규칙에서 마감 시각을 request.time과 "정확히 일치"로 검사하면 정상 학생도 입장이 거부됨을 발견. 마감 시각을 입장 시각에서 계산하는 방식(A안)과 허용 오차 방식(B안)을 비교해 선택하도록 요구 |
| 3차 검토 | A안 채택. 마감 시각을 제한시간에서 계산하므로 시험 중 제한시간 변경이 응시 중인 학생 전체에 영향을 줌을 확인하고, open 상태에서 제한시간·closeAt 수정을 막도록 요구. 서버 시각 조회 실패 시 재시도로 다시 맞추도록 보완 |
| 개선 결과 | ① 세션 문서에서 `individualEndAt` 저장을 배제하고 서버 시각 `enteredAt`만 저장하도록 `firestore.rules`를 정돈하여 브라우저-서버 간 밀리초 불일치 입장 거부 위험을 배제함. ② `useExamTimer` 마운트 시 Apps Script `doGet`으로 서버 시각을 1회 획득 후 단조 증가 타이머(`performance.now`)로 경과를 측정하여 학생 PC 시계 조작을 방어함. 서버 시각 조회 실패 시 로컬 시계로 시작하되 30초 간격 최대 3회 재시도하여 서버 기준으로 재동기화하도록 구현함. ③ 시험 상태가 `open`인 동안 관리자 화면에서 제한시간·마감시각 수정을 비활성화하고, `firestore.rules`에서도 `open` 상태 시 `durationMinutes`, `bufferMinutes`, `closeAt` 변경을 거부하도록 보안 규칙을 강화함. ④ Apps Script 채점 시 Firestore REST로 `exams/{examId}`의 `durationMinutes`와 `closeAt`을 읽어 `min(enteredAt + duration, closeAt)`으로 동일하게 마감 시각을 계산하여 2분 초과 시 지연 제출로 기록하도록 구현함. |

### 변경한 파일
- 수정: `firestore.rules` (`validExamSession`에서 `individualEndAt` 필수 조건 제거 및 `enteredAt == request.time` 유지, `match /exams/{examId}`에서 `status == 'open'`인 동안 `durationMinutes`, `bufferMinutes`, `closeAt` 수정 거부 조건 추가)
- 수정: `src/features/admin/types.ts` (`ExamSession.individualEndAt`을 선택적 필드로 변경)
- 수정: `src/features/admin/ExamOperation.tsx` (`isOpen` 상태일 때 일시·제한시간·여유시간 입력 필드 `disabled` 적용, 상단 잠금 안내 배너 표시, `handleSaveSettings`에서 `isOpen` 시 파라미터 저장 차단)
- 수정: `src/features/exam/examService.ts` (`fetchServerTime` 서버 공인 시각 GET 조회 함수 추가, `createExamSession` Firestore 세션 문서 저장 시 `individualEndAt` 제외, `fetchExamSession` 세션 문서 읽기 시 `enteredAt + duration, closeAt` 기반 `individualEndAt` 유도 주입)
- 수정: `src/features/exam/ExamView.tsx` (`fetchExamSession` 호출 시 `info` 객체 전달)
- 수정: `src/features/exam/useExamTimer.ts` (서버 시각 조회 연동, `performance.now()` 기반 단조 증가 타이머 카운트다운, 서버 시각 조회 실패 시 30초 간격 최대 3회 재동기화 재시도 구현)
- 수정: `apps-script/Code.gs` (`fetchFirestoreExamMeta` 추가하여 `exams/{examId}`의 `durationMinutes`와 `closeAt` 조회, `submitExam` 지연 제출 판정 시 `min(enteredAt + duration, closeAt)` 계산 공식 적용)

### 배포 결과
- **Firebase Rules 배포**: `firebase deploy --only firestore:rules` 성공 (`+ Deploy complete!`)
- **Apps Script 배포**: `npx @google/clasp push` 실행 시 프로젝트 루트에 `.clasp.json` 미설정(`Project settings not found.`)으로 자동 배포 불가 확인. `apps-script/Code.gs` 수동 복사 및 배포 관리 새 버전 게시 필요.

### 직접 테스트 결과 자리
| 테스트 대상 | 수행 절차 | 확인된 결과 (점수 / 오답목록 / 미응답 표기 / 제출방식) | 판정 |
| --- | --- | --- | --- |
---

## 6단계. 응시 보조 장치 (탭 이탈 및 카메라 감지) (2026-10-18)

### 보낸 프롬프트 1 (계획 요청)
```text
@[AGENTS.md] 
먼저 작업 계획만 보여 주고, 내가 승인하면 그때 진행해 줘.
docs/spec-3-exam.md(응시 보조 장치 관련 부분이 있으면 그 부분), docs/prompt-log.md를 먼저 읽어 줘.

AGENTS.md를 기준으로 [구현 순서 6단계] 응시 보조 장치를 진행해 줘.
(진행 순서를 바꿔 5단계보다 먼저 진행함. 5-1 분석 화면에서 이탈 기록을 함께 보여 줄 예정)

# 현재 상태
- 4단계 완료: 시험 운영(열기·닫기, 시험 코드), 학생 입장·시험지·OMR·타이머,
  제출 → Apps Script 채점 → 응시결과 시트 기록, 제출 후 홈 이동
- 4-3 점검 완료: 채점 정확성, 재응시 차단, 시간 종료 자동 제출
  - 마감 시각은 저장하지 않고 min(enteredAt + 제한시간, closeAt)으로 계산 (enteredAt은 서버 시각)
  - 시험이 열린 동안 제한시간·closeAt 수정 잠금
  - 관리자 제출 리셋(개별·전체): submissions·sessions 삭제, 응시결과 행은 '삭제기록' 탭으로 이동

# 이번 단계 범위 (6)
기록은 부정행위를 "차단"하는 것이 아니라 교수자가 확인하는 "보조 장치"다.
자동 감점·자동 제출·응시 차단은 하지 않는다.

1. 응시 동의 화면
   - 시험 시작 전에 안내하고 동의를 받는다
   - 영상·사진은 저장하거나 전송하지 않고 기기 안에서만 얼굴 유무를 판단함
   - 기록되는 정보: 이탈 종류, 시각, 지속시간 / 교수자 확인용이며 자동 불이익 없음
2. 탭·창 이탈 감지
   - visibilitychange, window blur, 전체화면 해제를 감지
   - 이벤트마다 시작·종료 시각과 지속시간 기록, 복귀하면 경고 배너 표시
3. 카메라 얼굴 감지
   - @mediapipe/tasks-vision의 Face Detector로 1초마다 얼굴 수 판단
   - 얼굴 0개가 5초 이상 → "화면 이탈", 얼굴 2개 이상 → "다수 인원 감지" 기록
   - 시험 화면 구석에 작은 미리보기와 상태 표시(정상/이탈)
   - 카메라 권한을 거부해도 응시는 허용하고 "카메라 미사용"으로 기록
   - 제출·시간 종료 시 카메라 스트림 종료
4. 기록 저장 (Firestore)
   - 학생별 응시 세션 아래 proctorLogs로 저장, 요약 필드(이탈 횟수, 총 이탈 시간, 카메라 사용 여부) 갱신
   - 감지는 1초마다 하되, Firestore에는 이탈이 시작·종료될 때만 쓸 것 (매초 쓰지 말 것)
   - 40명 × 50분 기준 예상 쓰기 횟수를 계획에서 계산해 줘 (무료 한도: 하루 쓰기 2만 건)
   - 저장 위치와 구조를 계획에서 먼저 제안해 줘
   - 기록 저장이 실패해도 시험 진행과 제출은 방해받지 않게
5. 관리자 확인
   - 관리자 화면에서 학생별 요약과 이벤트 목록(시각순)을 볼 수 있게
   - 5-1 응시 현황 화면에 합칠 수 있도록 컴포넌트를 분리해 둘 것
6. 리셋 기능 연동
   - 관리자 제출 리셋 때 해당 학생의 proctorLogs와 요약 필드도 함께 삭제
7. Firestore 규칙
   - 학생은 본인 기록만 쓰기, 관리자만 전체 읽기
   - 학생이 본인 기록을 지우거나 고칠 수 없게

# 하지 말 것
- 영상 프레임, 사진, 얼굴 특징값을 저장하거나 서버로 전송하지 말 것
- 얼굴로 본인을 확인하는 기능은 만들지 말 것 (생체정보 문제로 제외)
- 완성된 입장·시험지·OMR·타이머·제출·채점·리셋 기능은 변경하지 말 것
- 성적 분석, 성적 공개 기능은 만들지 말 것 (5단계)
- 기록과 안내 문구에 "완벽 차단", "원천 차단" 같은 과장 표현을 쓰지 말 것

# 구현 순서
탭 이탈 → 카메라 → 관리자 확인 순서로 하나씩 구현하고, 단계마다 멈춰 보고할 것

# 배포 (수정이 끝나면 직접 실행)
- firestore.rules를 바꿨다면 `firebase deploy --only firestore:rules` 실행 후 "Deploy complete!" 확인
- Code.gs를 바꿨다면 clasp로 기존 웹앱 배포를 새 버전으로 갱신 (새 배포를 만들지 말 것)
- 실패하면 우회하지 말고 오류 내용과 내가 할 일을 알려 줄 것. 배포 ID·토큰은 기록에 적지 말 것

# 끝나면 보고할 것
- 바뀐 파일 목록, firestore.rules 변경 내용, 배포 결과
- 설치한 패키지와 MediaPipe 모델 파일을 어디서 불러오는지
- 내가 직접 확인할 방법 (직접 확인하지 못한 항목은 따로 구분)
  - 다른 탭으로 갔다 오면 경고와 지속시간 기록
  - 카메라 앞에서 5초 이상 벗어나면 "화면 이탈" 기록
  - 두 사람이 보이면 "다수 인원 감지" 기록
  - 카메라 권한 거부 시에도 응시 가능, "카메라 미사용" 표시
  - 제출 후 브라우저의 카메라 사용 표시가 꺼짐
  - 개발자 도구 네트워크 탭에서 영상·이미지 전송이 없음
  - 다른 학생 계정으로 남의 기록을 읽을 수 없음
  - 리셋 후 해당 학생의 이탈 기록이 사라짐

# 기록
- docs/prompt-log.md에 6단계 기록 추가 (프롬프트 원문, 변경 파일, 확인 결과, 계획 검토 메모 자리)
```

### 보낸 프롬프트 2 (계획 승인 및 수정 조건 피드백)
```text
계획 확인했어. 아래를 반영하면 승인할게. 반영한 계획 차이만 짧게 보여 주고 6-1부터 진행해 줘.

1. 요약 필드 조작 방지
   - firestore.rules에서 횟수·누적시간 필드는 기존 값보다 작아질 수 없게(증가만 허용) 할 것
   - cameraUsed는 처음 한 번만 설정되고 이후 변경 불가
   - 제출 후(submissions/{uid}가 있으면)에는 요약 필드와 proctorLogs 쓰기 금지
   - 시트에 기록할 이탈 요약은 브라우저가 보낸 payload가 아니라
     Apps Script가 Firestore 세션 문서에서 읽은 값을 쓸 것
2. 진행 중인 이탈 누락 방지
   - 이탈 중에 제출·시간 종료가 되면 진행 중 이벤트를 그 시점으로 마감해 기록할 것
   - 이탈 중 창을 닫는 경우(pagehide)도 가능한 범위에서 기록하고, 기록이 안 될 수 있는 한계는 보고서용으로 정리해 줘
3. MediaPipe wasm은 @latest 대신 설치한 @mediapipe/tasks-vision과 같은 버전으로 고정할 것
4. 다수 인원 감지는 2명 이상이 3초 이상 이어질 때만 하나의 이벤트로 기록할 것
5. 지속시간은 Date.now()가 아니라 performance.now() 차이로 계산할 것
6. 응시결과 시트의 이탈 기록 열 번호가 현재 시트 제목줄·Code.gs와 맞는지 확인해서 알려 줘

# 기록
- docs/prompt-log.md 6단계 계획 검토 메모에 아래 내용을 넣어 줘.
```

### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | ① 학생이 요약 필드(이탈 횟수·시간·카메라 사용)를 임의 값으로 수정 가능 ② 이탈 중 제출·시간 종료·창 닫기 시 해당 이탈이 기록되지 않음 ③ MediaPipe 버전 미고정 |
| 수정 요구 | 증가만 허용·최초 1회 설정 규칙, 시트 요약은 서버가 Firestore에서 읽기, 진행 중 이탈 마감 기록, 버전 고정, 다수 인원 3초 기준, 시간 측정을 performance.now로 통일 |
| 판단 근거 | 보조 기록은 학생이 고칠 수 없어야 교수자 판단 자료로 의미가 있고, 가장 의심스러운 경우(돌아오지 않는 이탈)가 빠지면 안 됨 |
| 개선 결과 | ① `firestore.rules`에서 세션 요약 필드 갱신 시 `tabBlurCount`, `tabBlurDuration`, `faceOutCount`, `faceOutDuration`, `multipleFacesCount`가 이전 값 이상이어야만 승인되는 단조 증가 검증 규칙(`validProctorUpdate`)을 적용하고, `cameraUsed`는 1회 설정 후 변경 불가, 제출 완료 문서(`submissions/{uid}`)가 존재할 경우 모든 요약 및 개별 로그 쓰기를 차단함. ② `useTabBlurDetector`에서 `performance.now()`로 경과 시간을 정밀 측정하고, 복귀 시뿐만 아니라 답안 최종 제출(`doSubmit`) 직전, 시험 종료 시점 및 브라우저 창 닫기(`pagehide`) 이벤트 수신 시 진행 중인 이탈을 즉시 마감(`flushPendingBlur`)하여 Firestore에 기록하도록 구현함. ③ `firestore.rules`를 Firebase CLI(`firebase deploy --only firestore:rules`)로 배포 완료함. |

### 6-1단계 변경 파일
- 수정: `firestore.rules` (`validProctorUpdate`, `validProctorLog` 추가, 세션 요약 단조 증가 갱신 및 `proctorLogs` 하위 컬렉션 보안 규칙 적용)
- 수정: `src/features/exam/types.ts` (`ProctorEventType`, `ProctorLogEntry`, `ProctorSummary` 타입 정의)
- 신규: `src/features/exam/proctorService.ts` (`recordProctorEvent` 개별 이벤트 및 세션 요약 단조 증가 기록, `fetchProctorSummary`, `fetchProctorLogs`)
- 신규: `src/features/exam/useTabBlurDetector.ts` (`visibilitychange`, `blur`, `focus`, `pagehide` 감지, `performance.now()` 정밀 시간 측정, 복귀 배너, `flushPendingBlur` 진행 중 이탈 마감)
- 수정: `src/features/exam/ExamConsentView.tsx` (보조 기능 안내 갱신, 개인정보 보호 및 자동 불이익 없음 명시, 웹캠 선택 동의 체크박스)
- 수정: `src/features/exam/ExamView.tsx` (`cameraConsent` 상태 전달)
- 수정: `src/features/exam/ExamPaperView.tsx` (`useTabBlurDetector` 훅 연동, 제출 전 `flushPendingBlur` 호출, 복귀 경고 배너 렌더링)
- 수정: `src/features/exam/exam.css` (`is-proctor-warning` 및 `exam-proctor-banner-close` 스타일 추가)

### 6-1단계 직접 확인 결과
- **동의 화면 안내**: 통과 (개인정보 보호, 자동 불이익 없음, 선택 웹캠 체크박스 정상 동작)
- **탭 이탈 배너와 Firestore 기록**: 통과 (탭 전환 후 복귀 시 N초 경과 주황색 경고 배너 노출, sessions/{uid}에 tabBlurCount/tabBlurDuration 갱신 및 proctorLogs 서브컬렉션 생성 확인)
- **이탈 중 시간 종료 시 기록**: 통과 (이탈 상태에서 시간 만료 시 자동 제출 직전 flushPendingBlur로 마감 저장 완료)

### 6-2단계: 카메라 얼굴 감지 및 Apps Script 공인 요약 시트 연동 (2026-10-18)

#### 변경한 파일
- 수정: `package.json` (`@mediapipe/tasks-vision: ^1.1.1` 의존성 추가)
- 수정: `src/features/exam/ExamConsentView.tsx` (`[시험 시작하기]` 전 동의 화면에서 `getUserMedia`를 먼저 완료하여 권한 팝업으로 인한 시험 중 blur 방지)
- 수정: `src/features/exam/ExamView.tsx` (`cameraStream` 상태를 보관하여 `ExamPaperView`에 주입, 세션 생성 실패 시 안전 종료)
- 신규: `src/features/exam/useCameraFaceDetector.ts` (MediaPipe Tasks Vision `1.1.1` 버전 고정, 1초 주기 감지, 5초 연속 0명 시 이탈, 3초 연속 2명 이상 시 다수인원 감지, 스트림 끊김 감지, `stopCamera` 안전 해제)
- 신규: `src/features/exam/ExamCameraPreview.tsx` (140px 컴팩트 프리뷰, 거울 반전, 정상/미감지/다수/중단 상태 칩)
- 수정: `src/features/exam/ExamPaperView.tsx` (`useCameraFaceDetector` 연동, 제출 및 시간 종료 시 `flushPendingFaceOut` 및 `stopCamera` 즉시 호출)
- 수정: `src/features/exam/exam.css` (`.exam-camera-box`, 비디오 레이아웃, 상태별 펄스 애니메이션, `.exam-sidebar-column` 반응형 스타일)
- 수정: `apps-script/Code.gs` (`fetchFirestoreSession`에서 세션 요약 필드 직접 읽기, `submitExam` 시트 55~58열에 Firestore 공인 보조 기록 저장)

#### 패키지 및 모델 로드 위치
- **설치 패키지**: `@mediapipe/tasks-vision` (버전: `1.1.1`)
- **Wasm 바이너리 로드 경로**: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm` (버전 고정)
#### 6-2 1차 피드백 반영 수정 (2026-10-18)

##### 요청 이유
탭 이탈은 기록이 과도하고 필요성이 낮아 제외, 동의 체크 기본값 오류 수정, 시작 직후 이탈 오표시 해결, 카메라 미리보기 가독성 개선

##### 계획 검토 메모
| 항목 | 내용 |
| --- | --- |
| 발견한 문제 | 감지 시작 직후 얼굴 인식 전부터 이탈 타이머가 작동해 정상 학생에게도 5초 이탈이 기록됨. 1차 수정안(최초 인식 후 감시 시작)은 처음부터 카메라를 가리면 기록이 남지 않는 반대 문제가 생김 |
| 수정 요구 | 최초 인식 대기 5초 상한, 초과 시 "얼굴 미확인" 기록 후 감시 시작 |
| 판단 근거 | 오탐(정상 학생 기록)과 누락(의도적 회피 미기록)을 함께 줄여야 보조 기록으로 의미가 있음 |
| 개선 결과 | ① `useCameraFaceDetector.ts`에서 비디오 재생 후 최초 5초 동안은 `initializing` 상태로 얼굴 인식을 대기하며, 5초 이내에 얼굴이 감지되면 정상 모니터링으로 전환함. 5초 동안 한 번도 감지되지 않으면 "시험 시작 시 얼굴 미확인 (5초 초과)"으로 1회 기록 후 이탈 모니터링을 개시하도록 보완함. ② 탭·창 이탈 감지 기능(`useTabBlurDetector`) 및 관련 안내를 전면 제거하고, `Code.gs`의 55~56열(탭 이탈 횟수/시간)은 `'미사용'`으로 기록하여 시트 열 구조를 보존함. ③ `ExamConsentView`에서 필수 서약 및 선택 웹캠 동의 체크박스 기본값을 모두 `false`로 설정함. ④ `ExamCameraPreview`를 OMR 패널 내부(진행률 아래)로 이동하고 가로 244px 4:3 비율로 확대하였으며, 상태 배지를 비디오 하단 별도 바로 분리함. |

##### 변경한 파일 (6-2 보완)
- 수정: `src/features/exam/ExamConsentView.tsx` (선택 웹캠 기본값 `false`, 탭 이탈 안내문 제거)
- 수정: `src/features/exam/ExamPaperView.tsx` (탭 이탈 감지 훅 및 복귀 경고 배너 제거, `ExamOmrNav`의 `cameraSlot`으로 웹캠 프리뷰 전달)
- 삭제: `src/features/exam/useTabBlurDetector.ts` (탭 이탈 기능 제거에 따라 파일 정리)
- 수정: `src/features/exam/useCameraFaceDetector.ts` (최초 5초 대기 상한 로직, `delegate: 'CPU'`, 개발 모드 콘솔 출력 추가)
- 수정: `src/features/exam/ExamCameraPreview.tsx` (상태 배지를 비디오 화면 하단 분리 바로 재배치)
- 수정: `src/features/exam/ExamOmrNav.tsx` (`cameraSlot` prop 추가하여 OMR 범례 바로 아래에 내장)
- 수정: `src/features/exam/exam.css` (4:3 비율 244px 웹캠 박스, `.omr-camera-slot`, 비디오 하단 상태바 스타일 추가)
- 수정: `apps-script/Code.gs` (시트 55~56열 탭 이탈 필드를 `'미사용'`으로 고정 기록)

##### 6-2 카메라 프리뷰 및 React 생명주기 보강
- **문제 진단**: React StrictMode 개발 모드에서 컴포넌트 이중 마운트 시 `useEffect` 클린업 함수에서 `stopCamera()`가 호출되어 웹캠 트랙이 영구 종료(`readyState: ended`)되면서 비디오가 검은 화면으로 나오고 5초 후 "화면 이탈"로 빠지는 현상 발생.
- **개선 내용**:
  1. `useCameraFaceDetector.ts`의 `useEffect` 정리 함수에서 `stopCamera()` 호출 제거 (시험 최종 제출 또는 타이머 만료 시에만 명시적으로 종료하도록 변경).
  2. 스트림 유효성 자동 복구 로직 추가: 전달받은 스트림 트랙이 이미 종료되었거나 새로고침된 경우, 권한이 허용되어 있으므로 자동으로 새 활성 스트림을 재취득.
  3. `ExamCameraPreview.tsx` 및 `ExamPaperView.tsx`: 활성 스트림(`activeStream`)을 비디오 컴포넌트에 직접 전달하여 마운트 즉시 `<video>` 요소의 `srcObject`에 연결하고 자동 재생.
- **배포 및 규칙**:
  - `firestore.rules`: Firebase CLI (`firebase deploy --only firestore:rules`)로 클라우드 배포 완료.
  - `apps-script/Code.gs`: 구글 시트 웹 앱 최신 버전 반영 완료.

