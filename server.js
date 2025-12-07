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
let requestLogs = [];

// 관리자 비밀번호
const ADMIN_PASSWORD = 'admin123';

// 요청 로그 기록
app.use((req, res, next) => {
  const log = {
    timestamp: new Date().toLocaleString('ko-KR'),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  requestLogs.push(log);
  // 최근 100개만 유지
  if (requestLogs.length > 100) {
    requestLogs.shift();
  }
  next();
});

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

// DELETE: 댓글 삭제 (관리자만)
app.delete('/api/comments/:id', (req, res) => {
  const { password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: '관리자 비밀번호가 틀렸습니다' });
  }
  
  const id = parseInt(req.params.id);
  const index = comments.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다' });
  }
  
  comments.splice(index, 1);
  res.json({ success: true, message: '댓글이 삭제되었습니다' });
});

// GET: 관리자 로그 조회
app.get('/api/admin/logs', (req, res) => {
  const { password } = req.query;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: '관리자 비밀번호가 틀렸습니다' });
  }
  
  res.json({
    success: true,
    logs: requestLogs,
    commentCount: comments.length,
    comments: comments
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
