import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'

export function CookiesTab({ detail }: DetailTabProps) {
  return (
    <DataTable
      headers={['Cookie Name', 'Value', 'Domain', 'Path', 'Expiration Time', 'SameSite', 'Secure', 'HttpOnly']}
      rows={detail.cookies.map((c) => [c.name, c.value, c.domain, c.path, c.expires, c.sameSite, c.secure ? 'Yes' : 'No', c.httpOnly ? 'Yes' : 'No'])}
      empty="This URL set no cookies."
    />
  )
}
