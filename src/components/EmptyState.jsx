export default function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">{title}</div>
      {body && <div className="empty-state__body">{body}</div>}
    </div>
  )
}
