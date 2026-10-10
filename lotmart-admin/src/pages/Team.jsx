import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Card, Empty } from '../components/ui'

export default function Team() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [msg, setMsg] = useState('')
  const [u, setU] = useState('')
  const [p, setP] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/admin/admins')
      setAdmins(res.data.admins || [])
    } catch { setMsg('Failed to load team') }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/admin/admins', { username: u.trim(), password: p })
      setMsg('Admin created')
      setU(''); setP(''); load()
    } catch (er) { setMsg(er?.response?.data?.message || 'Create failed') }
  }

  const remove = async (username) => {
    if (!confirm('Remove ' + username + '?')) return
    try { await api.delete('/admin/admins/' + username); setMsg('Removed'); load() }
    catch (er) { setMsg(er?.response?.data?.message || 'Remove failed') }
  }

  return (
    <div>
      <PageHeader title="Team & access" sub="Admin accounts. Only the super admin can add or remove." />
      {msg && <div className="alert ok">{msg}</div>}
      <Card title="Add admin">
        <form onSubmit={create}>
          <div className="form-grid two">
            <div><label className="lbl">Username</label><input className="input" value={u} onChange={(e) => setU(e.target.value)} required /></div>
            <div><label className="lbl">Password</label><input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} required /></div>
          </div>
          <button className="btn" style={{ marginTop: 12 }}>Create admin</button>
        </form>
      </Card>
      <Card title={'Admins (' + admins.length + ')'}>
        {admins.length === 0 ? <Empty title="No admins" /> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Username</th><th>Role</th><th>Created by</th><th></th></tr></thead>
            <tbody>{admins.map((a) => (
              <tr key={a.username}>
                <td><strong>{a.username}</strong>{a.username === user?.username && <span className="pill blue"> you</span>}</td>
                <td>{a.isSuperAdmin ? <span className="pill amber">Super admin</span> : <span className="pill gray">Admin</span>}</td>
                <td>{a.createdBy || '—'}</td>
                <td>
                  {!a.isSuperAdmin && a.username !== user?.username && (
                    <button className="btn danger sm" onClick={() => remove(a.username)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
