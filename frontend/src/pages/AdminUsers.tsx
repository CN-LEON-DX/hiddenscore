import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers();
      setUsers(response.data.users);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập trang quản lý người dùng');
      } else {
        setError('Không thể tải danh sách người dùng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      await adminApi.updateUserRole(editingUser.id, selectedRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, role: selectedRole } : user
      ));
      
      setEditingUser(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError('Không thể cập nhật vai trò người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý người dùng</h1>
          <button 
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left border-b">ID</th>
                <th className="py-3 px-4 text-left border-b">Tên</th>
                <th className="py-3 px-4 text-left border-b">Email</th>
                <th className="py-3 px-4 text-left border-b">Vai trò</th>
                <th className="py-3 px-4 text-left border-b">Trạng thái</th>
                <th className="py-3 px-4 text-left border-b">Ngày tạo</th>
                <th className="py-3 px-4 text-left border-b">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{user.id}</td>
                  <td className="py-3 px-4 border-b">{user.name}</td>
                  <td className="py-3 px-4 border-b">{user.email}</td>
                  <td className="py-3 px-4 border-b">
                    {editingUser?.id === user.id ? (
                      <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Chờ xác nhận'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {editingUser?.id === user.id ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleSaveRole}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Lưu
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditRole(user)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Sửa vai trò
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không có người dùng nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers; 