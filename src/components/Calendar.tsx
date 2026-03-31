import { useTime } from '../hooks/useLocalStorage'

export function Calendar() {
  const time = useTime()
  const year = time.getFullYear()
  const month = time.getMonth()
  const today = time.getDate()

  const monthName = time.toLocaleString('en-US', { month: 'long' })
  
  // First day of month (0 = Sunday, 6 = Saturday)
  const firstDay = new Date(year, month, 1).getDay()
  // Number of days in current month
  const lastDay = new Date(year, month + 1, 0).getDate()

  const daysHeader = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  const cells = []
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />)
  }
  // Days of current month
  for (let d = 1; d <= lastDay; d++) {
    const isToday = d === today
    cells.push(
      <div key={d} className={`calendar-cell day ${isToday ? 'today' : ''}`}>
        {d}
      </div>
    )
  }

  return (
    <div className="mini-calendar">
      <div className="calendar-month-year">
        {monthName} {year}
      </div>
      <div className="calendar-days-header">
        {daysHeader.map(d => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells}
      </div>
    </div>
  )
}
