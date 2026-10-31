import type { FieldTableProps } from '../../interfaces/detailProps'

export function FieldTable({ fields }: FieldTableProps) {
  return (
    <table className="simple">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <tr key={`${f.label}-${i}`}>
            <td>{f.label}</td>
            <td className="wrap">{f.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
