import { createContext, useState, useEffect } from "react"
import { getMe } from "./services/auth.api"

// Context for global user session state
export const AuthContext = createContext()

/**
 * @name AuthProvider
 * @description Provides authenticated user state and session initialization across the React app.
 */
export const AuthProvider = ({ children }) => { 
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Verify session state on initial app load
    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                if (data && data.user) {
                    setUser(data.user)
                } else {
                    setUser(null)
                }
            } catch (err) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}