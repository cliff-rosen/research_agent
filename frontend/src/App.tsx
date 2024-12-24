import { BrowserRouter } from 'react-router-dom'
import TopBar from './components/TopBar'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { setSessionExpiredHandler } from './lib/api'
import { setStreamSessionExpiredHandler } from './lib/api/streamUtils'
import LoginForm from './components/auth/LoginForm'
import ResearchWorkflow from './components/ResearchWorkflow'
import MockWorkflow from './components/MockWorkflow'

// Define available workflows
const WORKFLOWS = [
  {
    id: 'research',
    name: 'Research Assistant',
    description: 'AI-powered research workflow to analyze questions and find comprehensive answers',
    component: ResearchWorkflow
  },
  {
    id: 'mock',
    name: 'Text Processor',
    description: 'A simple two-step workflow that processes text input',
    component: MockWorkflow
  }
] as const

function App() {
  const { handleSessionExpired, isAuthenticated, login, register, error } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState(WORKFLOWS[0].id)

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired)
    setStreamSessionExpiredHandler(handleSessionExpired)
    return () => setSessionExpiredHandler(() => { })
  }, [handleSessionExpired])

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 bg-gray-50">
            <LoginForm
              isRegistering={isRegistering}
              setIsRegistering={setIsRegistering}
              login={login}
              register={register}
              error={error}
            />
          </div>
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  // Find the selected workflow component
  const WorkflowComponent = WORKFLOWS.find(w => w.id === selectedWorkflow)?.component || WORKFLOWS[0].component

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
          <TopBar />
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <label htmlFor="workflow-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Workflow
              </label>
              <select
                id="workflow-select"
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="block w-full max-w-xs rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORKFLOWS.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {WORKFLOWS.find(w => w.id === selectedWorkflow)?.description}
              </p>
            </div>
            <div className="flex-1">
              <WorkflowComponent />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App 