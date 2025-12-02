import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo Section */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <a 
            href="https://vite.dev" 
            target="_blank"
            className="transition-all hover:scale-110 hover:drop-shadow-[0_0_2em_#646cffaa]"
          >
            <img 
              src={viteLogo} 
              className="h-24 p-6" 
              alt="Vite logo" 
            />
          </a>
          <a 
            href="https://react.dev" 
            target="_blank"
            className="transition-all hover:scale-110 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-spin-slow"
          >
            <img 
              src={reactLogo} 
              className="h-24 p-6" 
              alt="React logo" 
            />
          </a>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Vite + React
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Back Office - Tailwind CSS Test
        </p>

        {/* Card Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 mb-4"
          >
            count is {count}
          </button>
          <p className="text-slate-200 mt-4">
            Edit <code className="bg-slate-800 px-2 py-1 rounded text-blue-400">src/App.tsx</code> and save to test HMR
          </p>
        </div>

        {/* Footer */}
        <p className="text-slate-400 text-sm">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App
