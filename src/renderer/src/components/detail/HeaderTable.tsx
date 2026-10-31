import type { HeaderTableProps } from '../../interfaces/detailProps'

export function HeaderTable({ headers }: HeaderTableProps) {
  if (headers.length === 0) return <p className="grid-empty">No response headers.</p>
  return (
    <table className="simple">
      <thead>
        <tr>
          <th>Header Name</th>
          <th>Header Value</th>
        </tr>
      </thead>
      <tbody>
        {headers.map((h, i) => (
          <tr key={`${h.name}-${i}`}>
            <td>{h.name}</td>
            <td className="wrap">{h.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
