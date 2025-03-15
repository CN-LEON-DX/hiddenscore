import { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (!user) {
      axios.get('/api/me', {
        withCredentials: true
      })
        .then(response => {
          setUser(response.data);
          sessionStorage.setItem('user', JSON.stringify(response.data));
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
          } else {
            console.error("Error in useAuth:", error);
          }
        });
    }
  }, [user]);

  const logout = () => {
    axios.get('/api/auth/logout', {
      withCredentials: true
    })
      .then(() => {
        setUser(null);
        sessionStorage.removeItem('user');
        window.location.href = '/';
      })
      .catch(error => {
        console.error("Error logging out:", error);
      });
  };

  return { user, logout };
};

export default useAuth;
