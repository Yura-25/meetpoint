import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-4xl font-bold text-center mb-4">
                Welcome to MeetPoint! 🎉
              </h1>
              <p className="text-center text-gray-600">
                Your team is ready to start building. Frontend setup complete!
              </p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App

