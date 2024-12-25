import { BrowserRouter } from 'react-router-dom'
import TopBar from './components/TopBar'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { setSessionExpiredHandler } from './lib/api'
import { setStreamSessionExpiredHandler } from './lib/api/streamUtils'
import LoginForm from './components/auth/LoginForm'
import ResearchWorkflow from './components/ResearchWorkflow'
import LabWorkflow from './components/LabWorkflow'
import KbWorkflow from './components/KbWorkflow'

// Define available workflows
const WORKFLOWS = [
  {
    id: 'lab',
    name: 'Template Workflow  ',
    description: 'A template workflow for creating new workflows',
    path: '/lab',
    component: LabWorkflow,
    landingComponent: LabWorkflow
  },
  {
    id: 'research',
    name: 'Research Assistant',
    description: 'AI-powered research workflow to analyze questions and find answers',
    path: '/research',
    component: ResearchWorkflow,
    landingComponent: ResearchWorkflow
  },
  {
    id: 'kb',
    name: 'Knowledge Base',
    description: 'Build and manage a knowledge graph database',
    path: '/kb',
    component: KbWorkflow,
    landingComponent: KbWorkflow
  }
] as const

function App() {
  const { handleSessionExpired, isAuthenticated, login, register, error } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<typeof WORKFLOWS[number]['id']>(WORKFLOWS[0].id)

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
          <div className="relative">
            {/* Workflow Selector - positioned in top-right */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <select
                id="workflow-select"
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value as typeof selectedWorkflow)}
                className="text-sm rounded-md border border-gray-300 dark:border-gray-600 py-1 px-2 
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {WORKFLOWS.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              <div className="group relative">
                <button
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Workflow info"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="invisible group-hover:visible absolute right-0 mt-2 w-64 p-2 text-sm 
                              bg-white dark:bg-gray-800 rounded-md shadow-lg 
                              border border-gray-200 dark:border-gray-700
                              text-gray-600 dark:text-gray-300">
                  {WORKFLOWS.find(w => w.id === selectedWorkflow)?.description}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
              <div className="flex-1">
                <WorkflowComponent />
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App 