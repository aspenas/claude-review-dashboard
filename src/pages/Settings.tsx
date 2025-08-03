import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSpring, animated } from '@react-spring/web'
import { Save, Bell, DollarSign, Slack, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { OrganizationSettings } from '@/types'

export default function Settings() {
  const queryClient = useQueryClient()
  const [hasChanges, setHasChanges] = useState(false)

  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 25 }
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  })

  const [formData, setFormData] = useState<OrganizationSettings | null>(null)

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setHasChanges(false)
    }
  })

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentData = formData || settings

  const handleChange = (field: keyof OrganizationSettings, value: any) => {
    setFormData({ ...currentData, [field]: value })
    setHasChanges(true)
  }

  const handleSave = () => {
    if (formData) {
      updateMutation.mutate(formData)
    }
  }

  return (
    <animated.div style={fadeIn} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure organization-wide settings for Claude reviews
        </p>
      </div>

      <div className="space-y-6">
        {/* Budget Settings */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Budget Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set monthly budget limits and alerts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Budget</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={currentData.monthly_budget}
                  onChange={(e) => handleChange('monthly_budget', parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alert Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={currentData.alert_threshold_percentage}
                  onChange={(e) => handleChange('alert_threshold_percentage', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Alert when budget usage exceeds this percentage
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure how you receive alerts
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={currentData.alert_enabled}
                  onChange={(e) => handleChange('alert_enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Enable budget alerts</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Recipients</label>
              <input
                type="text"
                value={currentData.alert_emails.join(', ')}
                onChange={(e) => handleChange('alert_emails', e.target.value.split(',').map(s => s.trim()))}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {currentData.slack_webhook_url && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Slack className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Slack notifications configured</span>
              </div>
            )}
          </div>
        </div>

        {/* Authorized Users */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Authorized Users</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GitHub usernames allowed to access the dashboard
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentData.authorized_users.map((user) => (
              <span
                key={user}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800"
              >
                @{user}
              </span>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <animated.div
            style={useSpring({
              from: { opacity: 0, transform: 'translateY(10px)' },
              to: { opacity: 1, transform: 'translateY(0px)' }
            })}
            className="flex justify-end"
          >
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </animated.div>
        )}
      </div>
    </animated.div>
  )
}