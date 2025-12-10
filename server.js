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

// 관리자 로그인 (ID/비밀번호)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || '';
  const ADMIN_PASS = process.env.ADMIN_PASS || '';
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

  if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_TOKEN) {
    return res.status(500).json({ success: false, message: '관리자 로그인이 구성되지 않았습니다' });
  }
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(403).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다' });
  }
  // 성공 시 토큰 반환 (기존 삭제 API와 호환)
  return res.json({ success: true, token: ADMIN_TOKEN });
});

// 관리자 토큰 검증 공통 로직
function getProvidedAdminToken(req) {
  const hdrRaw = req.header('x-admin-token');
  const hdrB64 = req.header('x-admin-token-b64');
  if (hdrB64) {
    try {
      return Buffer.from(hdrB64, 'base64').toString('utf8');
    } catch (e) {
      return '__INVALID_B64__';
    }
  }
  return hdrRaw || '';
}

// 관리자 아이디/비밀번호 검증 공통 로직
function getProvidedAdminCredentials(req) {
  const user = req.header('x-admin-user') || '';
  const passRaw = req.header('x-admin-pass');
  const passB64 = req.header('x-admin-pass-b64');
  let pass = passRaw || '';
  if (passB64) {
    try {
      pass = Buffer.from(passB64, 'base64').toString('utf8');
    } catch (e) {
      pass = '__INVALID_B64__';
    }
  }
  return { user, pass };
}

function isAdminByCredentials(req) {
  const expectedUser = process.env.ADMIN_USER || '';
  const expectedPass = process.env.ADMIN_PASS || '';
  const { user, pass } = getProvidedAdminCredentials(req);
  if (pass === '__INVALID_B64__') return false;
  return !!expectedUser && !!expectedPass && user === expectedUser && pass === expectedPass;
}

// GET: 관리자 토큰 검증
app.get('/api/admin/verify', (req, res) => {
  const expected = process.env.ADMIN_TOKEN;
  const provided = getProvidedAdminToken(req);
  const byCreds = isAdminByCredentials(req);
  if ((expected && provided === expected) || byCreds) {
    return res.json({ success: true });
  }
    return res.status(403).json({ success: false, message: '권한이 없습니다' });
});

// POST: 관리자 로그인 (아이디/비밀번호)
app.post('/api/admin/login', (req, res) => {
  const expectedUser = process.env.ADMIN_USER || '';
  const expectedPass = process.env.ADMIN_PASS || '';
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력하세요' });
  }
  if (!!expectedUser && !!expectedPass && username === expectedUser && password === expectedPass) {
    return res.json({ success: true });
  }
  return res.status(403).json({ success: false, message: '권한이 없습니다' });
});

// DELETE: 댓글 삭제 (id 기반, 관리자 전용)
app.delete('/api/comments/:id', (req, res) => {
  const expected = process.env.ADMIN_TOKEN;
  const provided = getProvidedAdminToken(req);
  if (provided === '__INVALID_B64__') {
    return res.status(400).json({ success: false, message: '잘못된 토큰 형식' });
  }
  const byCreds = isAdminByCredentials(req);
  if (!((expected && provided === expected) || byCreds)) {
    return res.status(403).json({ success: false, message: '권한이 없습니다' });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: '유효한 댓글 ID가 아닙니다' });
  }

  const idx = comments.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다' });
  }

  const [deleted] = comments.splice(idx, 1);
  // ID 재정렬은 하지 않음 (외부 참조 안정성 유지)
  return res.json({ success: true, deleted });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
