# errander WebView Migration Guide

> 이 문서는 `apps/mobile`에 네이티브로 구현된 모든 화면을 `apps/web` (React WebApp)으로 마이그레이션하기 위한 가이드입니다.
> 다른 AI 에이전트(Codex 등)가 이 가이드를 읽고 작업을 이어받을 수 있도록 작성되었습니다.

---

## 1. 아키텍처 개요

### 목표 구조

```
apps/mobile/   ← 네이티브 껍데기 (Shell)
               역할: WebView 로드, 인증 토큰 관리, 카메라/알림 등 네이티브 기능

apps/web/      ← 실제 앱 화면 전체 (WebView Content)
               역할: 홈, 심부름, 채팅, 마이페이지, 문의 등 모든 UI
```

### 현재 상태 (문제)

현재 모든 화면이 `apps/mobile/src/components/`에 React Native 컴포넌트로 구현되어 있음.
`apps/web/src/App.tsx`는 placeholder 상태.

### 마이그레이션 후 상태

- `apps/mobile`: WebView를 열고 토큰을 주입하는 Shell만 남김
- `apps/web`: 모든 화면을 React + Tailwind CSS로 새로 구현

---

## 2. 기술 스택

### apps/web (마이그레이션 대상)

| 항목 | 현재 | 마이그레이션 후 |
|------|------|----------------|
| 프레임워크 | React 19 + Vite | React 19 + Vite (유지) |
| 라우팅 | 없음 (placeholder) | React Router v7 추가 |
| 스타일링 | Tailwind CSS v4 | Tailwind CSS v4 (유지) |
| 상태관리 | 없음 | TanStack React Query v5 추가 |
| HTTP 클라이언트 | 없음 | Axios 추가 |
| 실시간 | 없음 | WebSocket (네이티브 브릿지 통해) |
| 인증 | 없음 | 토큰은 Native에서 받아 메모리에 저장 |

### apps/mobile (Shell로 축소)

유지할 것:
- WebView 렌더링 (`react-native-webview`)
- 인증 흐름 (OTP 로그인, 토큰 저장)
- Native Bridge (토큰 전달, 카메라, 위치 등)
- 푸시 알림 수신

제거할 것:
- `src/components/my/`, `src/components/chat/`, `src/components/errand/` 등 모든 화면 컴포넌트
- `src/hooks/useErrands.ts`, `useChatRooms.ts` 등 화면용 훅

---

## 3. API 정보

### Base URL
```
https://bj9l28xy18.execute-api.ap-northeast-2.amazonaws.com/dev
```

### 인증
모든 API 요청에 `Authorization` 헤더로 ID 토큰 전달:
```
Authorization: {idToken}
```

토큰은 Native(React Native)에서 관리하고, WebView가 로드될 때 `window.postMessage`로 전달받음 (아래 Native Bridge 섹션 참고).

### 엔드포인트 목록

#### 인증
| Method | Path | 설명 |
|--------|------|------|
| POST | `/auth/otp` | OTP 이메일 발송 |
| POST | `/auth/verify` | OTP 검증, 토큰 발급 |
| POST | `/auth/refresh` | 토큰 갱신 |

#### 사용자
| Method | Path | 설명 |
|--------|------|------|
| GET | `/me` | 내 프로필 조회 |
| PUT | `/me` | 프로필 최초 설정 |
| PATCH | `/me` | 프로필 수정 |
| DELETE | `/me` | 회원 탈퇴 |

#### 심부름
| Method | Path | 설명 |
|--------|------|------|
| GET | `/errands` | 심부름 목록 (query: `mine=true`, `status`, `category`) |
| POST | `/errands` | 심부름 생성 |
| GET | `/errands/:id` | 심부름 상세 |
| PATCH | `/errands/:id/status` | 상태 변경 (body: `{ status: ErrandStatus }`) |

#### 심부름꾼
| Method | Path | 설명 |
|--------|------|------|
| GET | `/erranders` | 심부름꾼 목록 (query: `areaId`) |

#### 채팅
| Method | Path | 설명 |
|--------|------|------|
| GET | `/chat/rooms` | 채팅방 목록 |
| GET | `/chat/:roomId/messages` | 채팅 메시지 목록 |
| POST | `/chat/:roomId/messages` | 메시지 전송 (body: `{ content: string }`) |

#### WebSocket (실시간 채팅)
```
wss://6i2cs7w9vk.execute-api.ap-northeast-2.amazonaws.com/dev?token={idToken}
```
수신 메시지 형식:
```json
{ "type": "NEW_MESSAGE", "roomId": "string" }
```

#### 사진 업로드 (Presigned URL)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/errands/photos/presign` | Presigned URL 발급 |

Request body:
```json
{ "contentType": "image/jpeg" }
```
Response:
```json
{ "uploadUrl": "https://s3.../...", "publicUrl": "https://s3.../..." }
```
→ `uploadUrl`에 `PUT`으로 파일 업로드, `publicUrl`을 저장

#### 문의
| Method | Path | 설명 |
|--------|------|------|
| GET | `/inquiries` | 내 문의 목록 |
| POST | `/inquiries` | 문의 생성 |

---

## 4. 데이터 타입 (TypeScript)

`apps/mobile/src/types/`에서 가져다 쓰거나 `apps/web/src/types/`에 동일하게 복사할 것.

### errand.ts
```typescript
export type WhenOption = 'now' | 'today' | 'tomorrow' | 'custom';
export type ErrandStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface Errand {
  errandId: string;
  userId: string;
  status: ErrandStatus;
  title: string;
  category: string;
  when: string;
  areaId: string | null;
  where: string;
  photoUrls: string[];
  detail: string | null;
  erranderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ErrandFormData {
  what: string;
  when: WhenOption;
  customDate?: Date;
  areaId: string | undefined;
  where: string;
  photos: PhotoItem[];
}

export interface PhotoItem {
  id: string;
  localUri: string;
  publicUrl: string | null;
  isUploading: boolean;
}
```

### user.ts
```typescript
export type UserRole = 'traveler' | 'errander';

export interface UserProfile {
  id: string;
  initial: string;
  name: string;
  email: string;
  joinedAt: string;
  activeCount: number;
  completedCount: number;
  totalSpentLabel: string;
  paymentMethod: string;
  language: string;
  role: UserRole;
  avatarUrl?: string;
  areas?: string[];
}
```

### chat.ts
```typescript
export interface ChatRoom {
  id: string;
  erranderName: string;
  erranderInitial: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}
```

### errander.ts
```typescript
export type BadgeType = 'popular' | 'fast_response' | 'top_rated' | 'new' | 'native_en';

export interface Errander {
  id: string;
  initial: string;
  name: string;
  avatarColor: string;
  badge?: BadgeType;
  specialty: string;
  rating: number;
  completedJobs: number;
  languages: string[];
  pricePerHour: number;
  city: string;
}
```

### inquiry.ts
```typescript
export interface Inquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Native Bridge (WebView ↔ Native 통신)

### 토큰 수신 (Native → Web, 최우선 구현)

Native(React Native)가 WebView를 로드한 후 토큰을 주입함:

```typescript
// apps/web/src/hooks/useNativeBridge.ts 에서 처리
// window에 'message' 이벤트로 수신
window.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'AUTH_TOKEN') {
    // data.payload.idToken 을 메모리에 저장
    // API 클라이언트에 주입
  }
});
```

Native에서 보내는 메시지 형식:
```json
{
  "type": "AUTH_TOKEN",
  "payload": {
    "idToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Web → Native 메시지 전송

```typescript
// packages/shared/src/types/webview.ts 에 타입 정의됨
window.ReactNativeWebView?.postMessage(JSON.stringify({
  type: 'NAVIGATE',           // 네이티브 화면 이동 요청
  type: 'GET_USER_LOCATION',  // 위치 정보 요청
  type: 'AUTH_REQUEST',       // 소셜 로그인 요청
}));
```

### 토큰 갱신

401 에러 시 Native에 갱신 요청:
```typescript
window.ReactNativeWebView?.postMessage(JSON.stringify({
  type: 'AUTH_REQUEST',
  payload: { reason: 'token_expired' }
}));
```

---

## 6. 화면 목록 및 라우트 설계

`apps/web`에 구현해야 할 화면 목록:

| 화면 | 라우트 | 역할 접근 | 현재 네이티브 파일 |
|------|--------|----------|-------------------|
| 홈 (여행자) | `/` | traveler | `home/ServiceList.tsx`, `home/ErranderSection.tsx` |
| 홈 (심부름꾼) | `/` | errander | `home/NearbyErrandsSection.tsx` |
| 심부름 게시판 | `/errands` | errander | `errand/ErrandBoardScreen.tsx` |
| 심부름꾼 목록 | `/erranders` | traveler | `errand/ErranderListScreen.tsx` |
| 심부름 상세 | `/errands/:id` | both | `my/ErrandDetailScreen.tsx` |
| 심부름 등록 | `/errands/new` | traveler | `errand-request/ErrandRequestScreen.tsx` |
| 내 심부름 | `/my/errands` | both | `my/MyErrandsScreen.tsx` |
| 채팅 목록 | `/chat` | both | `chat/ChatScreen.tsx` |
| 채팅방 | `/chat/:roomId` | both | `chat/ErrandChatScreen.tsx` |
| 마이페이지 | `/my` | both | `my/MyScreen.tsx` |
| 문의 목록 | `/my/inquiries` | both | `inquiry/InquiryListScreen.tsx` |
| 문의 작성 | `/my/inquiries/new` | both | `inquiry/InquiryCreateScreen.tsx` |

---

## 7. 앱 색상 / 디자인 토큰

```
주색: #F97316 (orange-500)
배경: #FFF9F4
텍스트 주: #111827
텍스트 보조: #6B7280
텍스트 연: #9CA3AF
경계선: #E5E7EB
에러: #EF4444
성공: #10B981
```

카테고리별 색상:
```typescript
const CATEGORY_COLORS: Record<string, string> = {
  '예약 대행': '#DBEAFE',
  '공항 픽업': '#FEF3C7',
  '길찾기': '#D1FAE5',
  '기타': '#F3E8FF',
};
```

---

## 8. 지역 상수

```typescript
// apps/mobile/src/constants/areas.ts 와 동일
export const AREAS = [
  { id: 'seoul',   label: '서울' },
  { id: 'busan',   label: '부산' },
  { id: 'jeju',    label: '제주' },
  { id: 'incheon', label: '인천' },
  { id: 'daegu',   label: '대구' },
  // ... 등
];
```

---

## 9. 구현 순서 (권장)

### Phase 1 — 기반 설정
1. `apps/web/package.json`에 의존성 추가:
   - `react-router-dom` (라우팅)
   - `axios` (HTTP)
   - `@tanstack/react-query` (서버 상태)
2. `apps/web/src/api/client.ts` 생성 — Axios 인스턴스, 401 갱신 처리
3. `apps/web/src/hooks/useNativeBridge.ts` 수정 — 토큰 수신 로직 구현
4. `apps/web/src/main.tsx` 수정 — QueryClientProvider, BrowserRouter 감싸기
5. `apps/web/src/App.tsx` 수정 — React Router routes 정의

### Phase 2 — 핵심 화면
6. 홈 화면 (`/`) — 역할에 따라 분기
7. 마이페이지 (`/my`) — 프로필, 통계, 메뉴
8. 내 심부름 (`/my/errands`) — 상태 탭 필터

### Phase 3 — 심부름
9. 심부름 게시판 (`/errands`) — 심부름꾼용
10. 심부름 상세 (`/errands/:id`) — 상태 변경 버튼 포함
11. 심부름 등록 (`/errands/new`) — 4단계 폼

### Phase 4 — 채팅
12. 채팅 목록 (`/chat`)
13. 채팅방 (`/chat/:roomId`) — 실시간 WebSocket

### Phase 5 — 문의
14. 문의 목록 (`/my/inquiries`)
15. 문의 작성 (`/my/inquiries/new`) — 사진 첨부 포함

---

## 10. API 클라이언트 구현 참고

`apps/mobile/src/api/client.ts`의 로직을 웹용으로 이식:

```typescript
// apps/web/src/api/client.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

let idToken: string | null = null;

export function setToken(token: string) {
  idToken = token;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (idToken) config.headers.Authorization = idToken;
  return config;
});

// 401 시 Native에 토큰 갱신 요청
apiClient.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: 'AUTH_REQUEST', payload: { reason: 'token_expired' } })
      );
    }
    return Promise.reject(err);
  }
);
```

환경변수 파일 (`apps/web/.env`):
```
VITE_API_URL=https://bj9l28xy18.execute-api.ap-northeast-2.amazonaws.com/dev
VITE_WS_URL=wss://6i2cs7w9vk.execute-api.ap-northeast-2.amazonaws.com/dev
```

---

## 11. 주의사항

1. **이미지 업로드**: 웹에서는 `expo-image-picker` 대신 `<input type="file">` 사용. S3 presign 흐름은 동일.
2. **날짜 선택**: `@react-native-community/datetimepicker` 대신 `<input type="date">` 또는 라이브러리 사용.
3. **토큰 저장**: 웹에서는 `SecureStore` 사용 불가. 토큰은 메모리(변수)에만 저장. 페이지 새로고침 시 Native가 재주입.
4. **WebSocket**: 웹에서 직접 연결. `VITE_WS_URL?token={idToken}` 형태.
5. **뒤로가기**: `window.history.back()` 또는 React Router의 `useNavigate(-1)`.
6. **하단 탭 네비게이션**: Native Shell이 처리하거나, 웹에서 직접 구현. 현재 Native 탭 레이아웃 참고: `apps/mobile/app/(tabs)/_layout.tsx`.

---

## 12. 참고 파일 경로

| 내용 | 경로 |
|------|------|
| 네이티브 화면 컴포넌트 전체 | `apps/mobile/src/components/` |
| 타입 정의 | `apps/mobile/src/types/` |
| React Query 훅 | `apps/mobile/src/hooks/` |
| 지역/국가/언어 상수 | `apps/mobile/src/constants/` |
| WebView 브릿지 타입 | `packages/shared/src/types/webview.ts` |
| 현재 웹앱 진입점 | `apps/web/src/main.tsx` |
| 현재 웹앱 브릿지 훅 | `apps/web/src/hooks/useNativeBridge.ts` |

---

## 13. 개발 컨벤션 (Development Conventions)

> 이 섹션은 errander 프로젝트 전반에 적용되는 코드 컨벤션입니다.  
> 마이그레이션 작업 시 반드시 준수해야 합니다.

---

### 코드 품질 원칙

#### 매직 넘버 금지

```typescript
// ❌ 나쁜 예
await delay(300);

// ✅ 좋은 예
const ANIMATION_DELAY_MS = 300;
await delay(ANIMATION_DELAY_MS);
```

#### 모듈 구조

- 재사용 가능한 컴포넌트는 반드시 **분리된 파일**로 관리한다.
- `apps/mobile`과 `apps/web` 간 공유 로직은 `packages/shared`에 위치시킨다.
- 컴포넌트, 훅, 유틸리티는 각각 독립된 디렉토리로 분리한다.

---

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `TaskCard.tsx` |
| 훅 | camelCase + use 접두사 | `useTaskList.ts` |
| 유틸 함수 | camelCase | `formatDate.ts` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 타입/인터페이스 | PascalCase | `TaskPayload` |

---

### 경로 규칙

코드 내 모든 경로는 반드시 **절대 시스템 경로**를 사용한다.

```
✅ /Users/junho/errander/apps/web/src/components/Button.tsx
```

---

### 보안 원칙

- CVE가 알려진 라이브러리 버전은 **절대 사용하지 않는다.**
- 프로젝트 시작 전 및 정기적으로 `pnpm audit`를 실행한다.
- API 키, 시크릿은 코드에 하드코딩하지 않고 반드시 **환경변수**를 사용한다.
- WebView에서 `allowsInlineMediaPlayback`, `javaScriptEnabled` 등 보안 관련 설정은 변경 전 반드시 확인한다.

---

### 구현 원칙

- 요청된 기능은 **완전히 구현**한다. TODO, 플레이스홀더, 미완성 로직은 절대 남기지 않는다.
- 모든 필요한 import를 포함한다.
- 구현 전 **코드베이스를 먼저 탐색**한다.
- **명시적으로 요청하지 않은 코드·로직·컴포넌트는 절대 수정하지 않는다.**

---

### 작업 체크리스트 (Pre-Implementation Checklist)

코드를 작성하기 전 다음을 순서대로 확인한다:

```
[ ] 1. 코드베이스 탐색 완료 (기존 구현 파악)
[ ] 2. 관련 공식 문서 최신 버전 확인
[ ] 3. 단계별 의사코드 작성 완료
[ ] 4. 수정 범위 명확히 선언 (변경할 파일 목록)
[ ] 5. 구현 완료 후 미완성 항목 없음 확인
[ ] 6. import 누락 없음 확인
[ ] 7. 절대경로 사용 확인
[ ] 8. pnpm audit 이상 없음 확인
```
