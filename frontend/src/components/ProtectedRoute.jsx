import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'


export default function ProtectedRoute({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  if (loading) return <div>Cargando...</div>
  if (!user) return <Navigate to='/' replace />
  return children
}