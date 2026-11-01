import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    withCredentials: true
})

// Attach Bearer token from localStorage as fallback for cross-domain auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function verifyEmail({ email, otp }) {
    try {
        const response = await api.post('/api/auth/verify-email', {
            email, otp
        })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function resendOtp({ email }) {
    try {
        const response = await api.post('/api/auth/resend-otp', {
            email
        })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function forgotPassword({ email }) {
    try {
        const response = await api.post('/api/auth/forgot-password', {
            email
        })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function resetPassword({ email, otp, newPassword }) {
    try {
        const response = await api.post('/api/auth/reset-password', {
            email, otp, newPassword
        })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email, password
        })
        if (response.data?.token) {
            localStorage.setItem("token", response.data.token)
        }
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        localStorage.removeItem("token")
        return response.data
    } catch (err) {
        localStorage.removeItem("token")
        return null
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        return null
    }
}

export async function updateProfile({ username, email }) {
    try {
        const response = await api.put("/api/auth/update-profile", { username, email })
        return response.data
    } catch (err) {
        throw err?.response?.data || err
    }
}
