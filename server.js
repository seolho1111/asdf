const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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
  const idx = comments.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다' });
  }
  const [deleted] = comments.splice(idx, 1);
  res.json({ success: true, deleted });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});