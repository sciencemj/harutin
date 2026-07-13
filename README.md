# 🌿 하루틴 (Harutin)

데일리 루틴 체크 · TODO 관리 · 일정 관리를 **하나의 화면**에서 할 수 있는 개인 생산성 웹 애플리케이션입니다.

차가운 업무용 대시보드가 아니라, 다이어리를 펼치듯 편안하게 하루를 돌보는 경험을 목표로 합니다. 따뜻한 아이보리 종이 위에 세이지 그린과 테라코타가 스며든 팔레트, 고운바탕 세리프로 적힌 오늘의 날짜, 그리고 하루를 완성하면 새싹이 꽃으로 피어나는 진행 바가 그 중심입니다.

## 주요 기능

### 오늘 요약
- 오늘 날짜·요일, 시간대별 인사말 ("좋은 아침이에요. 오늘은 천천히, 하나씩 해봐요.")
- 할 일 완료 수 / 루틴 완료 수 / 남은 일정 수 요약 칩
- 하루 전체 진행률 — 새싹 🌱이 진행 바를 따라 자라고 100%에서 꽃 🌸이 핍니다

### 데일리 루틴
- 이모지·시간대(아침/오후/저녁)·반복 요일·메모를 가진 루틴 CRUD
- 시간대별 그룹 표시, 오늘 반복 대상이 아닌 루틴은 "쉬어가는 루틴"으로 접어 표시
- 연속 달성 일수(스트릭) 🔥 표시, 완료 시 카드가 세이지빛으로 밝아지는 애니메이션
- 오늘 루틴 전부 완료 시 축하 메시지

### TODO
- 빠른 추가(입력 후 Enter 한 번) + 상세 추가(우선순위·카테고리·마감일·예상 시간·메모)
- 오늘 / 예정 / 완료 필터, 우선순위·카테고리 필터
- 위/아래 버튼으로 순서 변경, 완료 항목 접기
- 마감 지난 항목은 아이콘+텍스트로 함께 표시 (색상에만 의존하지 않음)

### 일정
- 시작·종료 시간, 종일 여부, 카테고리, 장소, 메모를 가진 일정 CRUD
- 오늘 일정 시간순 정렬, **진행 중인 일정 강조**, 다음 일정까지 남은 시간 실시간 표시
- 미니 월간 캘린더 — 일정(테라코타)·할 일(세이지) 점 표시, 날짜 선택 시 그 날의 일정과 할 일 표시

### 빠른 추가
- 데스크톱: 상단 "새로 만들기" 드롭다운 / 모바일: 우측 하단 플로팅 버튼 → 드로어

### 하루 마무리
- 5단계 이모지 기분 선택, 오늘 잘한 일 한 줄, 내일 기억할 일 한 줄, 하루 완료율

### Apple 캘린더 동기화 (macOS 앱)
- Tauri로 감싼 macOS 데스크톱 앱에서 EventKit으로 Apple 캘린더와 **양방향 동기화**
- 설정 > Apple 캘린더 동기화 켜기 → 시스템 권한 승인 → 시작 시 + 5분마다 자동 동기화, "지금 동기화" 버튼도 제공
- 가져오기: 과거 30일~미래 365일의 Apple 일정을 앱에 반영 (Apple이 원본 — 수정/삭제 모두 따라감)
- 내보내기: 앱에서 만든 일정을 기본 캘린더에 생성, 이후 앱에서의 수정·삭제도 즉시 반영
- 반복 일정은 회차 단위로 가져오되 앱→Apple 수정은 막아 원본을 보호

## 사용 기술

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui (Base UI 기반) |
| 아이콘 | Lucide Icons |
| 날짜 처리 | date-fns (+ ko locale) |
| 상태 관리 | Zustand (persist 미들웨어) |
| 데이터 저장 | localStorage (백엔드 없음) |
| 폰트 | Noto Sans KR (본문) + Gowun Batang (세리프 포인트) |
| 데스크톱 | Tauri v2 (macOS), Rust + objc2-event-kit (EventKit) |

## 설치 방법

```bash
# Node.js 18.18+ (권장 20+) 필요
npm install
```

## 실행 명령어

```bash
# 웹
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 정적 빌드 (out/)
npm run lint     # ESLint 검사

# macOS 앱 (Rust 툴체인 필요)
npx tauri dev    # 데스크톱 앱 개발 모드
npx tauri build  # .app / .dmg 번들 생성 (src-tauri/target/release/bundle/)
```

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (폰트, Toaster)
│   ├── page.tsx            # 메인 화면 조립 + hydration 게이트
│   └── globals.css         # 테마 토큰(색·라운드), 커스텀 애니메이션
├── components/
│   ├── app-sidebar.tsx     # 데스크톱 사이드바 (로고, 내비, 미니 캘린더)
│   ├── mobile-nav.tsx      # 모바일 하단 내비게이션
│   ├── today-header.tsx    # 날짜·인사말·요약 칩·진행 바
│   ├── daily-progress.tsx  # 새싹 진행 바
│   ├── routine-section.tsx # 루틴 목록 + 카드
│   ├── todo-section.tsx    # TODO 목록 + 필터 + 빠른 추가
│   ├── schedule-section.tsx# 일정 목록 + 미니 캘린더 + 다음 일정 카드
│   ├── mini-calendar.tsx   # 점 표시 월간 캘린더
│   ├── quick-add.tsx       # 새로 만들기 버튼 + FAB + 드로어
│   ├── reflection-section.tsx # 하루 마무리
│   ├── settings-dialog.tsx # 이름 설정, 데이터 초기화
│   ├── confirm-dialog.tsx  # 삭제 확인 다이얼로그
│   ├── empty-state.tsx     # 따뜻한 빈 상태 안내
│   ├── forms/              # 루틴·TODO·일정 폼 다이얼로그
│   └── ui/                 # shadcn/ui 생성 컴포넌트
└── lib/
    ├── types.ts            # Routine, Todo, CalendarEvent, DailyReflection, Category, AppSettings
    ├── store.ts            # Zustand 스토어 (persist, 손상 데이터 방어)
    ├── seed.ts             # 첫 실행 예시 데이터
    ├── selectors.ts        # 진행률·필터 등 파생 계산
    ├── date.ts             # 날짜·시간·스트릭 유틸
    ├── use-now.ts          # 30초 간격 현재 시각 훅
    └── sync/               # 동기화 플랫폼
        ├── types.ts        # SyncProvider 인터페이스, ExternalEvent 공통 표현
        ├── engine.ts       # 동기화 엔진 (pull/push 조정, 프로바이더 레지스트리)
        └── apple-calendar.ts # Apple 캘린더 프로바이더 (Tauri invoke)
src-tauri/
├── src/calendar.rs         # EventKit 커맨드 (권한·조회·생성·수정·삭제)
├── src/lib.rs              # Tauri 엔트리
├── Info.plist              # 캘린더 권한 문구
└── tauri.conf.json         # 앱 설정 (out/ 서빙, 번들)
```

## 동기화 플랫폼 설계

여러 프로그램(Apple 캘린더, Obsidian, ...)의 일정과 TODO를 공통으로 관리하기 위한 구조:

- **허브 모델** — 하루틴 스토어가 일정·TODO의 원본(single source of truth)이고, 외부 프로그램은 `SyncProvider` 어댑터로 붙는다.
- **매칭 키** — 모든 항목은 `(source, externalId)` 쌍으로 외부 원본과 연결된다. `source: "local"`은 앱에서 만든 항목.
- **SyncProvider 인터페이스** (`src/lib/sync/types.ts`) — `capabilities`(events/todos), `pullEvents`, `createEvent`, `updateEvent`, `deleteEvent`. 새 프로그램 연동은 이 인터페이스 구현 + `engine.ts`의 `providers` 배열 등록이 전부다.
- **충돌 정책** — 프로바이더 소유 항목은 pull 시 프로바이더가 이기고, 앱에서의 편집은 즉시 push된다. push 불가 항목(반복 일정 회차)은 다음 pull에서 원본으로 복원된다.
- **확장 경로** — 엔진과 프로바이더는 UI와 분리되어 있어, 추후 트레이 상주 백그라운드 프로세스(또는 로컬 API 데몬)로 그대로 옮겨 Obsidian 플러그인·CLI 등 다른 클라이언트가 같은 허브를 쓰게 할 수 있다. Todo 타입에도 `source`/`externalId`가 이미 있어 TODO 동기화(예: Obsidian 마크다운 태스크)를 같은 방식으로 추가할 수 있다.

## 데이터 저장 방식

- **macOS 앱**: `~/Library/Application Support/dev.sciencemj.harutin/data.json` 파일에 저장됩니다. 앱을 지우고 다시 설치해도 데이터가 유지되며, 쓰기는 임시 파일 후 교체(atomic rename)라 중간에 꺼져도 깨지지 않습니다. 첫 실행 시 기존 WKWebView localStorage 데이터를 자동으로 파일로 옮깁니다.
- **브라우저**: `localStorage`의 `daily-app-storage` 키에 JSON으로 저장됩니다.
- Zustand `persist` 미들웨어가 저장/복원을 담당하며, **버전 필드(v1)** 를 포함해 추후 마이그레이션이 가능합니다.
- 저장 데이터가 없거나 손상된 경우에도 앱은 오류 없이 예시 데이터로 시작합니다 (`safeMerge` 방어 로직 + hydrate 실패 시 seed 상태 유지).
- SSR과 첫 클라이언트 렌더를 일치시키기 위해 `skipHydration` 후 마운트 시 수동 rehydrate하므로 hydration 오류가 없습니다.
- 모든 엔티티는 고유 ID(`crypto.randomUUID`), `createdAt`, `updatedAt`을 가집니다.
- 일정(`CalendarEvent`)에는 `source: "local" | "google" | "apple"` 과 `externalId` 필드가 있어, 추후 Google/Apple Calendar 연동 시 외부 일정을 같은 구조로 동기화할 수 있습니다.

## 향후 추가할 수 있는 기능

- Obsidian TODO 동기화 프로바이더 (마크다운 태스크 ↔ 앱 TODO)
- Google Calendar 프로바이더
- 트레이 상주 백그라운드 동기화 데몬 + 로컬 API
- Apple 캘린더별 카테고리 매핑
- 주간·월간 회고 통계 (기분 추이, 루틴 스트릭 그래프)
- 루틴 알림 (Web Push)
- 카테고리 사용자 정의 (추가·색상 변경)
- TODO 드래그 앤 드롭 정렬 (현재는 버튼 방식)
- 데이터 내보내기/가져오기 (JSON)
- 다크 모드 (저녁 시간대 자동 전환)
- PWA 설치 지원 (오프라인 사용)
