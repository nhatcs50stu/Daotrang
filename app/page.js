'use client';
import { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => new Date(d + 'T00:00').toLocaleDateString('vi-VN');
const LOAI = ['Thập trai', 'Mùng 1', 'Rằm', 'Kỳ thất', 'Khác'];
const TYPE_COLOR = { 'Thập trai': '#5D6658', 'Rằm': '#B8844A', 'Mùng 1': '#8A9484' };
const MENU = {
  personal: { n: 'Cá nhân', subs: ['Cây tu tập', 'Lịch'] },
  activity: { n: 'Hoạt động', subs: ['Điểm danh', 'Hoạt động ngày'] },
  about: { n: 'Về Đạo tràng', subs: ['Lịch sử', 'Mục tiêu', 'Bậc chân tu', 'Kinh'] },
  places: { n: 'Địa điểm', subs: [] },
  contact: { n: 'Liên hệ', subs: [] },
};

export default function Home() {
  const [role, setRole] = useState('guest');
  const [db, setDb] = useState(null);
  const [menu, setMenu] = useState('personal');
  const [sub, setSub] = useState(0);
  const [login, setLogin] = useState(false);

  const load = async () => { const r = await (await fetch('/api/data')).json(); setRole(r.role); setDb(r.db); };
  useEffect(() => { load(); }, []);
  const save = async (key, value) => {
    setDb((d) => ({ ...d, [key]: value }));
    const r = await fetch('/api/data', { method: 'PUT', body: JSON.stringify({ key, value }) });
    if (!r.ok) { alert('Bạn không có quyền sửa mục này'); load(); }
  };
  const admin = role === 'admin', can = admin || role === 'member';
  if (!db) return <p style={{ padding: 30 }}>Đang tải…</p>;
  const k = menu + sub;
  const T = (key, title, c) => <Text key={key} title={title} value={db[key]} can={c} onSave={(v) => save(key, v)} />;
  const upcoming = [...db.journey].filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const main = (
    <>
      {menu === 'personal' && <Journey view={sub === 0 ? 'tree' : 'calendar'} events={db.journey} admin={admin} onSave={(v) => save('journey', v)} />}
      {k === 'activity0' && <Attendance db={db} save={save} can={can} />}
      {k === 'activity1' && <Reports list={db.reports} can={can} onSave={(v) => save('reports', v)} att={db.attendance} total={db.members.length} />}
      {k === 'about0' && T('history', 'Lịch sử Đạo tràng Pháp Hoa', can)}
      {k === 'about1' && T('goals', 'Mục tiêu của Đạo tràng Pháp Hoa', admin)}
      {k === 'about2' && T('elders', 'Bậc chân tu đi trước · thành quả · công lao', can)}
      {k === 'about3' && T('sutras', 'Kinh', can)}
      {menu === 'places' && T('places', 'Địa điểm sinh hoạt', can)}
      {menu === 'contact' && T('contact', 'Liên hệ', admin)}
      {!can && menu !== 'personal' && <p className="muted">Đăng nhập thành viên để chỉnh sửa.</p>}
    </>
  );

  return (
    <div>
      <div className="top">
        <span style={{ width: 28 }} />
        <span>Đạo tràng Pháp Hoa</span>
        <svg width="28" height="28" viewBox="0 0 44 44" fill="none" stroke="#5D6658" strokeWidth="2.5" strokeLinejoin="round"><path d="M22 8c4 4 5 10 0 17-5-7-4-13 0-17z" /><path d="M22 25c-2-7-8-9-14-8 1 8 7 12 14 8z" /><path d="M22 25c2-7 8-9 14-8-1 8-7 12-14 8z" /></svg>
      </div>
      <nav className="navbar">
        {Object.entries(MENU).map(([key, m]) => (
          <button key={key} className={'nb ' + (menu === key ? 'on' : '')} onClick={() => { setMenu(key); setSub(0); }}>{m.n}</button>))}
        <span style={{ marginLeft: 'auto', color: '#F7F5F0', fontSize: 13 }}>{admin ? 'Quản trị viên' : can ? 'Thành viên' : 'Khách'}</span>
        {role === 'guest'
          ? <button className="nb login" onClick={() => setLogin(true)}>Đăng nhập</button>
          : <button className="nb" onClick={async () => { await fetch('/api/login', { method: 'DELETE' }); load(); }}>Đăng xuất</button>}
      </nav>
      {MENU[menu].subs.length > 0 && (
        <div className="subbar">{MENU[menu].subs.map((s, i) => <button key={s} className={'sb ' + (sub === i ? 'on' : '')} onClick={() => setSub(i)}>{s}</button>)}</div>)}
      <div className="body">
        {menu === 'personal' ? (
          <div className="cols">
            <div>
              <div className="card"><b>Sắp tới</b>
                {upcoming.length ? upcoming.map((e) => <div key={e.id} style={{ marginTop: 8, fontSize: 14 }}><b>{e.title}</b> · {fmt(e.date)}</div>) : <p className="muted">Chưa có ngày tu sắp tới.</p>}</div>
              <div className="card" style={{ fontSize: 14 }}><b>Loại ngày</b>
                {[['Thập trai', '#5D6658'], ['Rằm', '#B8844A'], ['Mùng 1', '#8A9484'], ['Khác / nhánh', '#C9B79C']].map(([t, c]) => (
                  <div key={t} style={{ marginTop: 8 }}><span className="dot" style={{ background: c }} />{t}</div>))}</div>
            </div>
            <div>{main}</div>
            <div>{T('quote', 'Lời dạy hôm nay', admin)}</div>
          </div>
        ) : main}
      </div>
      {login && <Login onClose={() => setLogin(false)} onOk={() => { setLogin(false); load(); }} />}
    </div>
  );
}

function Login({ onClose, onOk }) {
  const [r, setR] = useState('member'), [p, setP] = useState('');
  const go = async () => {
    const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ role: r, password: p }) });
    res.ok ? onOk() : alert('Sai mật khẩu');
  };
  return (
    <div className="modal" onClick={onClose}><div className="card" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
      <h3>Đăng nhập</h3>
      <div className="row"><select value={r} onChange={(e) => setR(e.target.value)}><option value="member">Thành viên</option><option value="admin">Admin</option></select></div>
      <div className="row"><input type="password" placeholder="Mật khẩu" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} /></div>
      <button className="btn" onClick={go}>Vào</button>
    </div></div>
  );
}

/* ---------- HÀNH TRÌNH: cây tu tập + lịch ---------- */
// Ngày không có "parent" nằm trên thân chính (nối theo thứ tự ngày). Ngày có "parent" là nhánh rẽ ra từ ngày đó.
function buildTree(events) {
  const s = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const ids = new Set(s.map((e) => e.id));
  const par = {}; let prev = null;
  s.forEach((e) => {
    if (e.parent && ids.has(e.parent)) par[e.id] = e.parent;
    else { par[e.id] = prev; prev = e.id; }
  });
  const kids = {}, roots = [];
  s.forEach((e) => (par[e.id] ? (kids[par[e.id]] ||= []).push(e.id) : roots.push(e.id)));
  Object.values(kids).forEach((k) => k.sort((a, b) => (par[b] === undefined ? 0 : 0) || (events.find((e) => e.id === a).parent ? 1 : 0) - (events.find((e) => e.id === b).parent ? 1 : 0)));
  const pos = {}; let col = 0;
  const walk = (id, d) => {
    const k = kids[id] || [];
    if (!k.length) { pos[id] = { x: d * 230, y: col++ * 170 }; return; }
    k.forEach((c) => walk(c, d + 1));
    pos[id] = { x: d * 230, y: pos[k[0]].y };
  };
  roots.forEach((r) => walk(r, 0));
  const nodes = s.map((e) => ({
    id: e.id, position: pos[e.id], sourcePosition: 'right', targetPosition: 'left',
    data: { label: <div>{e.image && <img src={e.image} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, marginBottom: 4 }} />}<b>{fmt(e.date)}</b><br />{e.title}{e.count ? ` · ${e.count} người` : ''}</div> },
    style: { width: 170, background: '#fff', border: '2px solid ' + (TYPE_COLOR[e.title] || '#C9B79C'), borderRadius: 12, fontSize: 13, padding: 6 },
  }));
  const edges = s.filter((e) => par[e.id]).map((e) => ({ id: 'e' + e.id, source: par[e.id], target: e.id, type: 'smoothstep', style: { stroke: '#5D6658' } }));
  return { nodes, edges };
}

function Journey({ events, admin, onSave, view }) {
  const [sel, setSel] = useState(null);
  const [month, setMonth] = useState(today().slice(0, 7));
  const { nodes, edges } = useMemo(() => buildTree(events), [events]);
  const add = (date, parent) => setSel({ id: uid(), date: date || today(), title: parent ? 'Khác' : 'Thập trai', who: '', count: '', place: '', note: '', image: '', parent: parent || '', isNew: true });
  const saveEv = (e) => { const { isNew, ...x } = e; onSave(isNew ? [...events, x] : events.map((i) => (i.id === x.id ? x : i))); setSel(null); };

  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
  const shift = (n) => { const d = new Date(y, m - 1 + n, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="row">
        <h2 style={{ margin: 0, flex: 1 }}>Quá trình tu tập của Tú Oanh</h2>
        {admin && <button className="btn" onClick={() => add()}>+ Thêm ngày tu</button>}
      </div>
      {!events.length && <p className="muted">Chưa có ngày tu tập nào.{admin && ' Bấm “+ Thêm ngày tu” để bắt đầu.'}</p>}
      {view === 'tree' ? (
        <>
          <div className="tree">
            <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.2} nodesDraggable={false} nodesConnectable={false}
              onNodeClick={(_, n) => setSel(events.find((e) => e.id === n.id))}>
              <Background color="#E6E2D6" /><Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <p className="muted">Kéo để di chuyển, lăn chuột để phóng to hoặc thu nhỏ. Bấm vào một ngày để xem{admin && ', bấm “+ Thêm nhánh” trong cửa sổ đó để vẽ nhánh mới'}.</p>
        </>
      ) : (
        <>
          <div className="row"><button className="btn alt" onClick={() => shift(-1)}>‹</button><b>Tháng {m}/{y}</b><button className="btn alt" onClick={() => shift(1)}>›</button></div>
          <div className="cal">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => <div key={d} className="h">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={'x' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = `${month}-${String(i + 1).padStart(2, '0')}`;
              return (
                <div key={d} className="day" onDoubleClick={() => admin && add(d)}>
                  <b>{i + 1}</b>
                  {sorted.filter((e) => e.date === d).map((e) => <div key={e.id} className="ev" onClick={() => setSel(e)}>{e.title}</div>)}
                </div>);
            })}
          </div>
          {admin && <p className="muted">Mẹo: bấm đúp vào một ngày để thêm nhanh.</p>}
        </>
      )}
      {sel && <EventModal key={sel.id} e={sel} admin={admin} onClose={() => setSel(null)} onSave={saveEv}
        onBranch={(p) => add(today(), p.id)}
        onDelete={() => { onSave(events.filter((i) => i.id !== sel.id)); setSel(null); }} />}
    </>
  );
}

function EventModal({ e, admin, onClose, onSave, onDelete, onBranch }) {
  const [f, setF] = useState(e);
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const up = async (ev) => {
    const fd = new FormData(); fd.append('file', ev.target.files[0]);
    const r = await (await fetch('/api/upload', { method: 'POST', body: fd })).json();
    if (r.url) setF({ ...f, image: r.url });
  };
  return (
    <div className="modal" onClick={onClose}><div className="card" onClick={(x) => x.stopPropagation()}>
      {admin ? (<>
        <h3>Thông tin ngày tu</h3>
        <div className="row"><input type="date" value={f.date} onChange={set('date')} />
          <select value={f.title} onChange={set('title')}>{LOAI.map((l) => <option key={l}>{l}</option>)}</select></div>
        <div className="row"><input placeholder="Tu tập cùng ai" value={f.who} onChange={set('who')} /></div>
        <div className="row"><input placeholder="Sĩ số" value={f.count} onChange={set('count')} /><input placeholder="Địa điểm" value={f.place} onChange={set('place')} /></div>
        <div className="row"><textarea placeholder="Ghi chú" value={f.note} onChange={set('note')} /></div>
        <div className="row"><input type="file" accept="image/*" onChange={up} /></div>
        {f.image && <img src={f.image} alt="" />}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => onSave(f)}>Lưu</button>
          {!e.isNew && <button className="btn alt" onClick={() => confirm('Xoá ngày này?') && onDelete()}>Xoá</button>}
          {!e.isNew && <button className="btn alt" onClick={() => onBranch(e)}>+ Thêm nhánh</button>}
          <button className="btn alt" onClick={onClose}>Đóng</button></div>
      </>) : (<>
        <h3>{e.title} · {fmt(e.date)}</h3>
        <p>📍 {e.place || '—'}<br />👥 Sĩ số: {e.count || '—'}<br />🤝 Cùng tu với: {e.who || '—'}</p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{e.note}</p>
        {e.image && <img src={e.image} alt="" />}
        <button className="btn" onClick={onClose}>Đóng</button>
      </>)}
    </div></div>
  );
}

function Attendance({ db, save, can }) {
  const [date, setDate] = useState(today()), [name, setName] = useState(''), [mode, setMode] = useState('day');
  const [month, setMonth] = useState(today().slice(0, 7));
  const day = db.attendance[date] || {};
  const mark = (id, v) => {
    const nd = { ...day }; day[id] === v ? delete nd[id] : (nd[id] = v);
    save('attendance', { ...db.attendance, [date]: nd });
  };
  const addM = () => { if (name.trim()) { save('members', [...db.members, { id: uid(), name: name.trim() }]); setName(''); } };
  const n = (v) => db.members.filter((m) => day[m.id] === v).length;
  const total = db.members.length;
  const stat = (l, v, c, bg) => <div style={{ background: bg, borderRadius: 14, padding: '14px 18px' }}><div style={{ color: c }}>{l}</div><div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, color: c }}>{v}</div></div>;
  const [y, m] = month.split('-').map(Number), dim = new Date(y, m, 0).getDate();
  const shift = (d) => { const t = new Date(y, m - 1 + d, 1); setMonth(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`); };
  const cell = (id, i) => { const v = (db.attendance[`${month}-${String(i).padStart(2, '0')}`] || {})[id]; return v === 'p' ? '✓' : v === 'l' ? 'P' : '–'; };
  return (
    <>
      <div className="stats">
        {stat('Sĩ số', total, '#3F4A3B', '#EEF1EA')}{stat('Có mặt', n('p'), '#2E6B3E', '#E8F2EA')}
        {stat('Nghỉ phép', n('l'), '#8A5A24', '#FFF3E2')}{stat('Vắng', total - n('p') - n('l'), '#A33B2F', '#FBEAE7')}
      </div>
      <div className="tabs" style={{ marginTop: 16 }}>
        <button className={'btn ' + (mode === 'day' ? '' : 'alt')} onClick={() => setMode('day')}>Theo ngày</button>
        <button className={'btn ' + (mode === 'month' ? '' : 'alt')} onClick={() => setMode('month')}>Theo tháng</button>
      </div>
      {mode === 'day' ? (
        <div className="card">
          <div className="row"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} /></div>
          <table>
            <thead><tr><th>Họ tên</th><th className="c">Có mặt</th><th className="c">Nghỉ</th><th /></tr></thead>
            <tbody>{db.members.map((mb) => (
              <tr key={mb.id}><td>{mb.name}</td>
                <td className="c"><input type="checkbox" disabled={!can} checked={day[mb.id] === 'p'} onChange={() => mark(mb.id, 'p')} /></td>
                <td className="c"><input type="checkbox" disabled={!can} checked={day[mb.id] === 'l'} onChange={() => mark(mb.id, 'l')} /></td>
                <td>{can && <button className="btn alt" onClick={() => confirm('Xoá ' + mb.name + '?') && save('members', db.members.filter((x) => x.id !== mb.id))}>✕</button>}</td></tr>))}
            </tbody>
          </table>
          {can && <div className="row" style={{ marginTop: 10 }}><input placeholder="Thêm thành viên…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addM()} /><button className="btn" onClick={addM}>Thêm</button></div>}
          <p className="muted">Tích “Có mặt” = đi · tích “Nghỉ” = nghỉ có phép · không tích = vắng.</p>
        </div>
      ) : (
        <div className="card">
          <div className="row"><button className="btn alt" onClick={() => shift(-1)}>‹</button><b>Tháng {m}/{y}</b><button className="btn alt" onClick={() => shift(1)}>›</button></div>
          <div className="scroll"><table>
            <thead><tr><th>Họ tên</th>{Array.from({ length: dim }, (_, i) => <th key={i} className="c">{i + 1}</th>)}<th className="c">Tổng</th></tr></thead>
            <tbody>{db.members.map((mb) => (
              <tr key={mb.id}><td style={{ whiteSpace: 'nowrap' }}>{mb.name}</td>
                {Array.from({ length: dim }, (_, i) => { const c = cell(mb.id, i + 1); return <td key={i} className="c" style={{ color: c === '✓' ? '#2E6B3E' : c === 'P' ? '#8A5A24' : '#A33B2F', fontWeight: 700 }}>{c}</td>; })}
                <td className="c"><b>{Array.from({ length: dim }, (_, i) => cell(mb.id, i + 1)).filter((c) => c === '✓').length}</b></td></tr>))}
            </tbody>
          </table></div>
          <p className="muted">✓ có mặt · P nghỉ phép · – vắng.</p>
        </div>
      )}
    </>
  );
}

function Reports({ list, can, onSave, att, total }) {
  const [f, setF] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const upload = async (e) => {
    const urls = [];
    for (const file of e.target.files) {
      const fd = new FormData(); fd.append('file', file);
      const r = await (await fetch('/api/upload', { method: 'POST', body: fd })).json();
      if (r.url) urls.push(r.url);
    }
    setF((x) => ({ ...x, photos: [...x.photos, ...urls] }));
  };
  const submit = () => { onSave(list.some((r) => r.id === f.id) ? list.map((r) => (r.id === f.id ? f : r)) : [f, ...list]); setF(null); };
  const present = (d) => Object.values(att[d] || {}).filter((v) => v === 'p').length;
  return (
    <>
      {can && !f && <button className="btn" onClick={() => setF({ id: uid(), date: today(), host: '', dharma: '', place: '', text: '', photos: [] })}>+ Viết báo cáo</button>}
      {f && (
        <div className="card">
          <div className="row"><input type="date" value={f.date} onChange={set('date')} /><input placeholder="Địa điểm" value={f.place || ''} onChange={set('place')} /></div>
          <div className="row"><input placeholder="Người giảng pháp (chủ trì)" value={f.host || ''} onChange={set('host')} /><input placeholder="Pháp danh" value={f.dharma || ''} onChange={set('dharma')} /></div>
          <textarea placeholder="Báo cáo hoạt động trong buổi tu…" value={f.text} onChange={set('text')} />
          <div className="row" style={{ marginTop: 8 }}><input type="file" accept="image/*" multiple onChange={upload} /></div>
          <div className="photos">{(f.photos || []).map((u) => <div key={u} style={{ position: 'relative' }}><img src={u} alt="" /><button className="btn alt" style={{ position: 'absolute', top: 4, right: 4, background: '#fff' }} onClick={() => setF({ ...f, photos: f.photos.filter((x) => x !== u) })}>✕</button></div>)}</div>
          <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={submit}>Lưu báo cáo</button><button className="btn alt" onClick={() => setF(null)}>Huỷ</button></div>
        </div>)}
      {[...list].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
        <div key={r.id} className="card" style={{ marginTop: 14 }}>
          <div className="host">
            <small>Người giảng pháp (chủ trì) · {fmt(r.date)}</small>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{r.host || 'Chưa ghi người chủ trì'}</div>
            {r.dharma && <div>Pháp danh: {r.dharma}</div>}
          </div>
          <p><span className="pill">{r.place || 'Chưa ghi địa điểm'}</span> <span className="pill">Sĩ số {total}</span> <span className="pill">Có mặt {present(r.date)}</span></p>
          <div style={{ whiteSpace: 'pre-wrap' }}>{r.text}</div>
          {r.photos?.length > 0 && <div className="photos" style={{ marginTop: 10 }}>{r.photos.map((u) => <img key={u} src={u} alt="" />)}</div>}
          {can && <div className="row" style={{ marginTop: 10 }}><button className="btn alt" onClick={() => setF({ photos: [], ...r })}>Sửa</button><button className="btn alt" onClick={() => confirm('Xoá báo cáo này?') && onSave(list.filter((x) => x.id !== r.id))}>Xoá</button></div>}
        </div>))}
      {!list.length && !f && <p className="muted">Chưa có báo cáo.</p>}
    </>
  );
}

function Text({ title, value, can, onSave }) {
  const [edit, setEdit] = useState(false), [v, setV] = useState(value);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {edit ? (<><textarea style={{ minHeight: 240 }} value={v} onChange={(e) => setV(e.target.value)} />
        <div className="row"><button className="btn" onClick={() => { onSave(v); setEdit(false); }}>Lưu</button><button className="btn alt" onClick={() => setEdit(false)}>Huỷ</button></div></>)
        : (<><p style={{ whiteSpace: 'pre-wrap' }}>{value || <span className="muted">Chưa có nội dung.</span>}</p>
          {can && <button className="btn alt" onClick={() => { setV(value); setEdit(true); }}>Chỉnh sửa</button>}</>)}
    </div>
  );
}
