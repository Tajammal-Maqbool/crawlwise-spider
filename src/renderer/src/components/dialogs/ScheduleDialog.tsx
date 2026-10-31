import { useCallback, useEffect, useState } from 'react'
import type { ScheduledTask, ScheduledTaskInput, ScheduleFrequency } from '@shared/interfaces/scheduledTask'
import type { ScheduleDialogProps } from '../../interfaces/dialogProps'
import { api } from '../../services/ipc/api'
import { ipcErrorMessage } from '../../utils/ipcErrorMessage'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { TextField } from '../common/TextField'

const today = () => new Date().toISOString().slice(0, 10)

export function ScheduleDialog({ config, onClose }: ScheduleDialogProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ScheduledTaskInput>({
    name: 'Scheduled crawl',
    startUrl: config.startUrl,
    frequency: 'weekly',
    date: today(),
    time: '09:00',
    outputFolder: '',
    exportTabs: [],
    bulkExports: ['issues-overview'],
    format: 'csv'
  })
  const reload = useCallback(() => {
    api.listSchedules().then(setTasks, (e: unknown) => setError(String(e)))
  }, [])
  useEffect(reload, [reload])
  const set = (patch: Partial<ScheduledTaskInput>) => setForm({ ...form, ...patch })
  const guard = async (action: () => Promise<unknown>) => {
    try {
      setError(null)
      await action()
      reload()
    } catch (err) {
      setError(ipcErrorMessage(err))
    }
  }
  const keys = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <Modal title="Scheduling" onClose={onClose}>
      <div className="config-section">
        {error && <div className="error-banner">{error}</div>}
        <p className="hint">Each schedule is a Windows Task Scheduler task that runs the CLI with your current configuration. JavaScript rendering is not used in scheduled crawls.</p>
        <TextField label="Name" value={form.name} onChange={(v) => set({ name: v })} />
        <TextField label="Start URL" value={form.startUrl} onChange={(v) => set({ startUrl: v })} />
        <label className="field">
          <span>Frequency</span>
          <select value={form.frequency} onChange={(e) => set({ frequency: e.target.value as ScheduleFrequency })}>
            <option value="once">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <TextField label="Start Date (YYYY-MM-DD)" value={form.date} onChange={(v) => set({ date: v })} />
        <TextField label="Time (HH:MM)" value={form.time} onChange={(v) => set({ time: v })} />
        <TextField label="Output Folder" value={form.outputFolder} hint="Crawl database and exports go here" onChange={(v) => set({ outputFolder: v })} />
        <TextField label="Export Filters" hint="Comma-separated filter keys" value={form.exportTabs.join(', ')} onChange={(v) => set({ exportTabs: keys(v) })} />
        <TextField label="Bulk Exports" hint="Comma-separated export keys" value={form.bulkExports.join(', ')} onChange={(v) => set({ bulkExports: keys(v) })} />
        <label className="field">
          <span>Format</span>
          <select value={form.format} onChange={(e) => set({ format: e.target.value as 'csv' | 'xlsx' })}>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </select>
        </label>
        <Button className="primary" onClick={() => void guard(() => api.createSchedule(form, config))}>
          Add Schedule
        </Button>
        <h3>Scheduled Crawls</h3>
        {tasks.length === 0 ? (
          <p className="hint">No schedules yet.</p>
        ) : (
          <table className="simple">
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td className="wrap">{t.startUrl}</td>
                  <td>
                    {t.frequency} from {t.date} at {t.time}
                  </td>
                  <td>
                    <Button onClick={() => void guard(() => api.deleteSchedule(t.id))}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}
