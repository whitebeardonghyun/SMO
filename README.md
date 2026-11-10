# SMO

영화와 콘서트 정보를 한곳에서 보고, 별점과 리뷰를 남기는 웹사이트예요.

- **시작 화면**: 영화 / 콘서트 두 항목만 크게 보여요.
- **영화**: 상영중 · 개봉 예정 포스터 목록 → 포스터를 누르면 시놉시스, 예고편(YouTube), 정보, 리뷰
- **리뷰**: 👍 좋아요 / 👎 싫어요, 별점(평균 별점 자동 계산), 제목과 본문, 추천, 댓글
- **콘서트**: 다가오는 공연 목록과 상세 정보 (예시 데이터)

## 폴더 구조

```
smo-site/
├─ index.html            페이지 뼈대
├─ css/style.css         디자인
├─ js/data.js            영화 데이터 (여기서 영화를 추가하거나 고쳐요)
├─ js/app.js             화면 동작 (목록, 상세, 리뷰, 별점, 댓글)
├─ images/posters/       영화 포스터 이미지
└─ .nojekyll             GitHub Pages 설정용 빈 파일 (지우지 마세요)
```

## GitHub Pages로 배포하기

1. GitHub에서 새 저장소(Repository)를 만들어요. 예: `smo`
2. 이 폴더 안의 파일을 **그대로** 저장소 맨 위에 올려요. `index.html`이 저장소 바로 아래에 있어야 해요.
   - 웹에서 올릴 때: 저장소 → **Add file → Upload files** → 폴더 안 파일과 폴더를 모두 끌어다 놓고 **Commit changes**
   - `.nojekyll`은 숨김 파일이라 끌어다 놓을 때 빠질 수 있어요. 빠졌다면 **Add file → Create new file**로 이름만 `.nojekyll`인 빈 파일을 만들어 주세요.
3. 저장소 **Settings → Pages**에서 **Source: Deploy from a branch**, **Branch: main / (root)** 를 고르고 **Save**
4. 1~2분 뒤 `https://<내 아이디>.github.io/smo/` 주소로 열려요.

## 영화 추가 · 수정하기

`js/data.js`의 배열에 아래 형식으로 항목을 추가해요.

```js
{
  "id": "mymovie1",                       // 영문/숫자만, 다른 영화와 겹치지 않게
  "title": "영화 제목",
  "en": "English Title",
  "date": "2026-12-01",                   // 개봉일. 오늘 이후면 '개봉 예정'에 나와요
  "rate": "12",                           // all / 12 / 15 / 19
  "run": 120,                             // 상영 시간(분)
  "genre": "드라마, 스릴러",
  "dir": "감독 이름",
  "cast": [{ "name": "배우", "role": "배역" }],
  "syn": "시놉시스",
  "trailer": "https://www.youtube.com/watch?v=...",
  "poster": "images/posters/mymovie1.jpg" // 포스터 파일을 images/posters 폴더에 넣어요
}
```

## 알아두기

- 별점 · 리뷰 · 추천 · 댓글은 **보는 사람의 브라우저(localStorage)에만 저장**돼요. 서버가 없어서 다른 사람과 공유되지 않고, 브라우저 기록을 지우면 사라져요. 여러 사람이 함께 쓰려면 Firebase 같은 데이터베이스 연결이 필요해요.
- 예고편은 YouTube 새 탭에서 열려요.
- 콘서트 정보는 예시 데이터예요.
- 포스터와 예고편의 권리는 각 배급사에 있어요. 공개 서비스로 운영한다면 사용 허락을 받은 이미지를 써 주세요.
- `index.html`을 더블클릭해서 컴퓨터에서 바로 열어도 동작해요. 인터넷이 끊기면 글꼴만 기본 글꼴로 바뀌어요.
