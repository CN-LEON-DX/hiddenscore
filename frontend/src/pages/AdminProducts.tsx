import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  created_at: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing product
        await adminApi.updateProduct(editingId, formData);
        setProducts(products.map(product => 
          product.id === editingId ? { ...product, ...formData } : product
        ));
      } else {
        // Create new product
        const response = await adminApi.createProduct(formData);
        setProducts([...products, response.data.product]);
      }
      
      resetForm();
      setError(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(editingId ? 'Không thể cập nhật sản phẩm' : 'Không thể tạo sản phẩm mới');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      setLoading(true);
      await adminApi.deleteProduct(id);
      setProducts(products.filter(product => product.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError('Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      image_url: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {showForm ? 'Hủy' : 'Thêm sản phẩm mới'}
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Quay lại
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Tên sản phẩm</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">URL hình ảnh</label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Giá (VND)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Số lượng</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left border-b">ID</th>
                <th className="py-3 px-4 text-left border-b">Hình ảnh</th>
                <th className="py-3 px-4 text-left border-b">Tên</th>
                <th className="py-3 px-4 text-left border-b">Giá</th>
                <th className="py-3 px-4 text-left border-b">Số lượng</th>
                <th className="py-3 px-4 text-left border-b">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{product.id}</td>
                  <td className="py-3 px-4 border-b">
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {product.description.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
                    {product.price.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="py-3 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không có sản phẩm nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts; 