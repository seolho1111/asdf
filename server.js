const express = require('express');
const cors = require('cors');
const path = require('path');

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

// (관리자 전용 삭제/로그 API 제거됨)

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
