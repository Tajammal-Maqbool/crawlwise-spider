import type { LinkTableProps } from '../../interfaces/detailProps'

export function LinkTable({ links }: LinkTableProps) {
  if (links.length === 0) return <p className="grid-empty">No links.</p>
  return (
    <table className="simple">
      <thead>
        <tr>
          <th>Type</th>
          <th>From</th>
          <th>To</th>
          <th>Anchor Text</th>
          <th>Alt Text</th>
          <th>Follow</th>
          <th>Rel</th>
          <th>Status Code</th>
          <th>Link Position</th>
          <th>Link Path</th>
        </tr>
      </thead>
      <tbody>
        {links.map((l, i) => (
          <tr key={i}>
            <td>{l.type}</td>
            <td>{l.fromUrl}</td>
            <td>{l.toUrl}</td>
            <td>{l.anchor ?? ''}</td>
            <td>{l.alt ?? ''}</td>
            <td>{l.follow ? 'True' : 'False'}</td>
            <td>{l.rel ?? ''}</td>
            <td>{l.statusCode ?? ''}</td>
            <td>{l.position ?? ''}</td>
            <td>{l.pathType ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
