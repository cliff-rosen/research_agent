# Cognify Frontend Technical Stack

## Core Technologies
- React 18.2.0 (Latest stable version with concurrent features)
- TypeScript 5.0+ (For type safety and better developer experience)
- Vite 5.0+ (For faster development and building)

## Key Dependencies
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",      // For API data fetching and caching
    "@hookform/resolvers": "^3.3.0",        // Form validation
    "react-hook-form": "^7.45.0",           // Form handling
    "zod": "^3.22.0",                       // Schema validation
    "@radix-ui/react-primitives": "^1.0.0", // Accessible UI primitives
    "tailwindcss": "^3.4.0",                // Utility-first CSS
    "lucide-react": "^0.263.1",             // Icons
    "date-fns": "^2.30.0",                  // Date formatting
    "jotai": "^2.4.0",                      // Atomic state management
    "react-router-dom": "^6.20.0"           // Routing
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",    // Component testing
    "@testing-library/jest-dom": "^6.0.0",  // DOM testing utilities
    "vitest": "^1.0.0",                     // Unit testing framework
    "prettier": "^3.0.0",                   // Code formatting
    "eslint": "^8.45.0",                    // Linting
    "typescript": "^5.0.0"                  // TypeScript compiler
  }
}
```

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and constants
├── pages/               # Route pages
├── services/            # API and external service integrations
├── stores/              # State management
└── types/               # TypeScript type definitions

## Main features covered by this setup:

1. Development Experience:
- Fast refresh with Vite
- Type safety with TypeScript
- Consistent code style with ESLint + Prettier
- Component testing infrastructure

2. UI/UX:
- Responsive layouts with Tailwind CSS
- Accessible components with Radix UI
- Smooth animations (if needed)
- Icon system with Lucide

3. Data Management:
- API data fetching/caching with React Query
- Form handling with React Hook Form
- Client state with Jotai
- Type-safe API calls

4. Performance:
- Code splitting with React Router
- Optimized builds with Vite
- Lazy loading for larger components

## Command Setup
```bash
# Create new project with Vite
npm create vite@latest cognify -- --template react-ts

# Install dependencies
cd cognify
npm install

# Install UI and utility dependencies
npm install @tanstack/react-query @hookform/resolvers react-hook-form zod @radix-ui/react-primitives tailwindcss lucide-react date-fns jotai react-router-dom

# Install dev dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest prettier eslint typescript @types/react @types/react-dom

# Initialize Tailwind CSS
npx tailwindcss init -p
```

## Initial Setup Steps:

1. Set up routing:
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Topic from './pages/Topic'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="topic/:topicId" element={<Topic />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

2. Configure React Query:
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

3. Set up base API service:
```typescript
// src/services/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add interceptors for auth tokens and error handling
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```