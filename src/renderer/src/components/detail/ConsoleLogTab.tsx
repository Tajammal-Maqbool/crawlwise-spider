import type { DetailTabProps } from '../../interfaces/detailProps'
import { DataTable } from '../common/DataTable'

export function ConsoleLogTab({ detail }: DetailTabProps) {
  return <DataTable headers={['Message']} rows={detail.consoleLog.map((m) => [m])} empty="No console messages. Console messages need JavaScript rendering." />
}
