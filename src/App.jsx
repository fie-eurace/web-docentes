import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProfessorList from './components/ProfessorList'
import ProfessorDetails from './components/ProfessorDetails'
import Layout from './components/Layout'
import AdminPanel from './components/AdminPanel'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><ProfessorList /></Layout>} />
      <Route path="/:faculty" element={<Layout><ProfessorList /></Layout>} />
      <Route path="/:faculty/:career/:professorName" element={<Layout><ProfessorDetails /></Layout>} />
      <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
    </Routes>
  )
}

export default App