import { useState, useEffect } from 'react';
import axios from 'axios';

// Define user interface based on your API response
interface User {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: null | string;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8081/me', {
      withCredentials: true 
    })
    .then(response => {
      setUser(response.data);
    })
    .catch(error => {
      console.error("Error in useAuth:", error);
    });
  }, []);


  const logout = () => {
    axios.get('http://localhost:8081/auth/logout', {
      withCredentials: true
    })
    .then(() => {
      setUser(null);
      window.location.href = '/'; 
    });
  };

  return { user, logout };
};

export default useAuth;