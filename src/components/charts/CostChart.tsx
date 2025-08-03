import { useSpring, animated } from '@react-spring/web'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatCurrency, formatDate } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface CostChartProps {
  data: Array<{
    date: string
    cost: number
    count: number
  }>
}

export default function CostChart({ data }: CostChartProps) {
  const containerSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 25 }
  })

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Daily Cost',
        data: data.map(d => d.cost),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
      }
    ]
  }

  const options: ChartOptions<'line'> = {
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
          title: (context) => {
            const index = context[0].dataIndex
            return formatDate(data[index].date)
          },
          label: (context) => {
            const index = context.dataIndex
            return [
              `Cost: ${formatCurrency(context.parsed.y)}`,
              `Reviews: ${data[index].count}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value) => formatCurrency(value as number),
          font: {
            size: 12
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  }

  return (
    <animated.div style={containerSpring} className="glass rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Cost Trend</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Daily review costs over the last 30 days</p>
      </div>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </animated.div>
  )
}