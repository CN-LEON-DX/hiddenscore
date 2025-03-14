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

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (!user) {
      axios.get(API_URL + `/me`, {
        withCredentials: true
      })
          .then(response => {
            setUser(response.data);
            sessionStorage.setItem('user', JSON.stringify(response.data));
          })
          .catch(error => {
            console.error("Error in useAuth:", error);
          });
    }
  }, [user]);

  const logout = () => {
    axios.get(API_URL + '/auth/logout', {
      withCredentials: true
    })
        .then(() => {
          setUser(null);
          sessionStorage.removeItem('user');
          window.location.href = '/';
        });
  };

  return { user, logout };
};

export default useAuth;