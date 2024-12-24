import { useState } from 'react'
import { searchApi } from '../lib/api/searchApi'
import type { SearchResult } from '../lib/api/searchApi'

type Step = 'input' | 'results'

export default function LabWorkflow() {
  const [currentStep, setCurrentStep] = useState<Step>('input')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const response = await searchApi.search(query)
      setResults(response)
      setCurrentStep('results')
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setQuery('')
    setResults([])
    setCurrentStep('input')
  }

  if (currentStep === 'input') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Search Query
          </h2>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            placeholder="Enter your search query..."
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Search Results
          </h2>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            New Search
          </button>
        </div>
        
        <div className="space-y-6">
          {results.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No results found.</p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="border-b dark:border-gray-700 pb-4 last:border-0">
                <h3 className="text-lg font-medium mb-2">
                  <a 
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {result.title}
                  </a>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {result.link}
                </p>
                <p className="text-gray-700 dark:text-gray-200">
                  {result.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 