import { useSpring, animated } from '@react-spring/web'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { formatCurrency } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

interface RepositoryBreakdownProps {
  data: Record<string, number>
}

export default function RepositoryBreakdown({ data }: RepositoryBreakdownProps) {
  const containerSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    delay: 200,
    config: { tension: 200, friction: 25 }
  })

  const sortedRepos = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const chartData = {
    labels: sortedRepos.map(([repo]) => repo),
    datasets: [{
      data: sortedRepos.map(([, cost]) => cost),
      backgroundColor: [
        'rgba(168, 85, 247, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(196, 181, 253, 0.8)',
        'rgba(221, 214, 254, 0.8)',
        'rgba(237, 233, 254, 0.8)'
      ],
      borderColor: [
        'rgb(168, 85, 247)',
        'rgb(147, 51, 234)',
        'rgb(196, 181, 253)',
        'rgb(221, 214, 254)',
        'rgb(237, 233, 254)'
      ],
      borderWidth: 2,
      hoverOffset: 4
    }]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets
            const labels = chart.data.labels as string[]
            
            return labels.map((label, i) => ({
              text: label,
              fillStyle: datasets[0].backgroundColor?.[i] as string,
              strokeStyle: datasets[0].borderColor?.[i] as string,
              lineWidth: 2,
              hidden: false,
              index: i
            }))
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
          }
        }
      }
    },
    cutout: '60%'
  }

  const totalCost = sortedRepos.reduce((sum, [, cost]) => sum + cost, 0)

  return (
    <animated.div style={containerSpring} className="glass rounded-xl p-6 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Top Repositories</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Cost breakdown by repository</p>
      </div>
      <div className="relative h-64">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>
    </animated.div>
  )
}