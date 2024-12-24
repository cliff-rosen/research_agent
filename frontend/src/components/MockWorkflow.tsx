import { useState } from 'react'

type Step = 'input' | 'result'

export default function MockWorkflow() {
  const [currentStep, setCurrentStep] = useState<Step>('input')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')

  const handleSubmit = () => {
    // Mock processing - just reverse the text as an example
    setResult(inputText.split('').reverse().join(''))
    setCurrentStep('result')
  }

  const handleReset = () => {
    setInputText('')
    setResult('')
    setCurrentStep('input')
  }

  if (currentStep === 'input') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Step 1: Enter Text
          </h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-32 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            placeholder="Enter some text to process..."
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Process Text
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Step 2: Results
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded mb-4">
          <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Processed Result:</h3>
          <p className="text-gray-800 dark:text-gray-200">{result}</p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Over
        </button>
      </div>
    </div>
  )
} 