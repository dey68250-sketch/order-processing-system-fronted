const TONE_BY_STATUS = {
  PENDING: 'pill--pending',
  COMPLETED: 'pill--good',
  CONFIRMED: 'pill--good',
  CANCELLED: 'pill--bad',
}

export default function StatusPill({ status }) {
  if (!status) return <span className="pill pill--muted">&mdash;</span>
  const tone = TONE_BY_STATUS[status] || 'pill--muted'
  return <span className={`pill ${tone}`}>{status}</span>
}
