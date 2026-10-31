import type { DataTableProps } from '../../interfaces/detailProps'

export function DataTable({ headers, rows, empty }: DataTableProps) {
  if (rows.length === 0) return <p className="grid-empty">{empty}</p>
  return (
    <table className="simple">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className="wrap">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
