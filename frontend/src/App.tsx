import { BrowserRouter } from 'react-router-dom'
import TopBar from './components/TopBar'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { setSessionExpiredHandler } from './lib/api'
import LoginForm from './components/auth/LoginForm'
import settings from './config/settings'
import { SearchBar } from './components/common/SearchBar'

/*
all backend requests are made via api.ts, which implements axios interceptors
setSessionExpiredHandler accepts a callback function that is called when 401 is returned from backend
the callback function passed is handleSessionExpired, which is defined in AuthContext.tsx

handleSessionExpired behavior:
- called when 401 is returned from backend
- removes authToken and user from localStorage
- sets isAuthenticated to false
- sets user to null
- sets error to null
*/

function App() {
  const { handleSessionExpired, isAuthenticated, login, register, error } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    // Set up the session expired handler
    setSessionExpiredHandler(handleSessionExpired)

    // Clean up when component unmounts
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
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 my-4">
              Welcome to {settings.appName}
            </h1>
            <SearchBar />
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App 