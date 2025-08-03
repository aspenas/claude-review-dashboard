import { Line } from 'react-chartjs-2'
import { useSpring, animated } from '@react-spring/web'
import { formatCurrency } from '@/lib/utils'

interface CostTrendsProps {
  data: Array<{
    date: string
    cost: number
    count: number
  }>
}

export default function CostTrends({ data }: CostTrendsProps) {
  const containerSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 20 }
  })

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Daily Cost',
        data: data.map(d => d.cost),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
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
            const dataPoint = data[context.dataIndex]
            return [
              `Cost: ${formatCurrency(context.parsed.y)}`,
              `Reviews: ${dataPoint.count}`
            ]
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
    <animated.div style={containerSpring} className="glass rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Cost Trends</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Daily spending over time</p>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </animated.div>
  )
}