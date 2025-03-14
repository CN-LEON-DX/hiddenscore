import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Home from "./pages/Home.tsx"
import Login from "./pages/Login.tsx"
import Signup from "./pages/Signup.tsx";
import ConfirmEmail from "./pages/ConfirmEmail.tsx";
import Products from "./pages/Products.tsx";
import DetailProduct from "./pages/DetailProduct.tsx";
import Cart from './pages/Cart.tsx';
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import Checkout from "./pages/Checkout.tsx";

function App() {
  return (
      <BrowserRouter>
          <Header/>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/detail/:productId" element={<DetailProduct />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout/>} />
          </Routes>
          <Footer/>
      </BrowserRouter>
  )
}

export default App
