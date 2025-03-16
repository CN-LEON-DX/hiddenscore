import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup";
import ConfirmEmail from "./pages/ConfirmEmail";
import Products from "./pages/Products";
import DetailProduct from "./pages/DetailProduct";
import Cart from './pages/Cart';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Checkout from "./pages/Checkout";
import Error404 from './pages/Error404';
import Error from './pages/Error';
import GoogleCallback from './pages/GoogleCallback';
import ErrorBoundary from './components/ErrorBoundary';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <ToastContainer position="top-right" autoClose={3000} />
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
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/auth/google" element={<GoogleCallback />} />
            <Route path="/error" element={<Error />} />
            <Route path="/404" element={<Error404 />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
          <Footer/>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  )
}

export default App
