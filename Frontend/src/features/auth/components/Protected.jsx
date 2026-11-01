import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'
import { Loader } from "../../../components/Loader/Loader";

const Protected = ({children}) => {
    const { loading, user } = useAuth()

    if(loading){
        return <Loader title="Authenticating..." message="Verifying your session credentials..." />
    }

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected