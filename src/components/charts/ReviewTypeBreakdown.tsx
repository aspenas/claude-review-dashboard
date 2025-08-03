import { Bar } from 'react-chartjs-2'
import { useSpring, animated } from '@react-spring/web'
import { formatCurrency } from '@/lib/utils'

interface ReviewTypeBreakdownProps {
  data: Record<string, number>
}

export default function ReviewTypeBreakdown({ data }: ReviewTypeBreakdownProps) {
  const containerSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 20 }
  })

  const sortedTypes = Object.entries(data).sort(([, a], [, b]) => b - a)
  const labels = sortedTypes.map(([type]) => type.charAt(0).toUpperCase() + type.slice(1))
  const values = sortedTypes.map(([, cost]) => cost)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cost by Review Type',
        data: values,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(251, 191, 36, 0.8)',   // Yellow
          'rgba(168, 85, 247, 0.8)',   // Purple
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y
            const total = values.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${formatCurrency(value)} (${percentage}%)`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  }

  return (
    <animated.div style={containerSpring} className="glass rounded-xl p-6 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Review Types</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Cost breakdown by review type</p>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </animated.div>
  )
}