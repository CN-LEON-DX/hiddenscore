import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Home from "./pages/Home.tsx"
import Login from "./pages/Login.tsx"
import Signup from "./pages/Signup.tsx";
import Products from "./pages/Products.tsx"; // Make sure this file exists

function App() {
  return (
      <BrowserRouter>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<DetailProduct />} />
          </Routes>
      </BrowserRouter>
  )
}

export default App