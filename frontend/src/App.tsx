import { BrowserRouter } from 'react-router-dom'
import TopBar from './components/TopBar'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { setSessionExpiredHandler } from './lib/api'
import LoginForm from './components/auth/LoginForm'
import ResearchWorkflow from './components/ResearchWorkflow'

function App() {
  const { handleSessionExpired, isAuthenticated, login, register, error } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired)
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

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
          <TopBar />
          <div className="flex-1">
            <ResearchWorkflow />
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App 