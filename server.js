const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
// 정적 파일 서빙 (캐시 완화)
app.use((req, res, next) => {
  // HTML 문서는 항상 최신 반영되도록 캐시 방지
  if (req.path.endsWith('.html') || req.path === '/' ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static('.'));

// 루트 요청에서 index.html 강제 제공 및 캐시 방지 헤더 부여
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 댓글 저장소 (서버 재시작 시 초기화됨)
let comments = [];

// GET: 모든 댓글 조회
app.get('/api/comments', (req, res) => {
  res.json(comments);
});

// POST: 새 댓글 추가
app.post('/api/comments', (req, res) => {
  const { name, content } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ success: false, message: '이름과 댓글을 입력해주세요' });
  }
  
  const newComment = {
    id: comments.length + 1,
    name,
    content,
    date: new Date().toLocaleString('ko-KR')
  };
  
  comments.push(newComment);
  res.json({ success: true, comment: newComment });
});

// DELETE: 댓글 삭제 (id 기반)
app.delete('/api/comments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: '유효한 댓글 ID가 아닙니다' });
  }

  const idx = comments.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다' });
  }

  const [deleted] = comments.splice(idx, 1);

  // 남은 댓글의 ID를 유지하거나 재정렬하지 않습니다(외부 참조 안정성).
  // 필요 시 재정렬을 원하면 아래처럼 재할당 가능:
  // comments = comments.map((c, i) => ({ ...c, id: i + 1 }));

  res.json({ success: true, deleted });
});

// (관리자 전용 삭제/로그 API 제거됨)

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
