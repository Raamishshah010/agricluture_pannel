import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import service from '../../services/articleService';
import { toast } from 'react-toastify';

export default function SubCategories() {
    const [list, setList] = useState([]);
    const [cats, setCats] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        categoryId: ''
    });
    const [imagePreview, setImagePreview] = useState('');


    useEffect(() => {
        service.getSubCategories().then(res => {
            setList(res.data.items)
        })
            .catch(err => {
                toast.error(err.message);
            })
    }, []);

    const openAddModal = () => {
        if (cats.length <= 0) {
            service.getCategories().then(res => {
                setCats(res.data)
            })
                .catch(err => {
                    toast.error('fetching categories: ', err.message);
                })
        }
        setEditingItem(null);
        setFormData({
            name: '',
            image: '',
            categoryId: ''
        });
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (crop) => {
        if (cats.length <= 0) {
            service.getCategories().then(res => {
                setCats(res.data)
            })
                .catch(err => {
                    toast.error('fetching categories: ', err.message);
                })
        }
        setEditingItem(crop);
        setFormData({
            name: crop.name,
            image: crop.image || '',
            categoryId: crop.categoryId || ''
        });
        setImagePreview(crop.image || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setImagePreview('');
    };

    const handleFile = (e) => {
        if (e.target.files[0]) {
            setFormData(pre => ({ ...pre, image: e.target.files[0] }));
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.categoryId || !formData.image) {
            alert('Please fill in all required fields and select image');
            return;
        }

        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('categoryId', formData.categoryId);


        if (editingItem) {
            if (typeof formData.image !== "string") {
                fd.append('file', formData.image);
            }
           const res =  await service.updateSubCategory(editingItem.id, fd);
            setList(prev => prev.map(crop =>
                crop.id === editingItem.id
                    ? res.data
                    : crop
            ));
        } else {
            fd.append('file', formData.image);
            const res = await service.addSubCategory(fd);
            setList(prev => [...prev, res.data]);
        }

        closeModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this?')) {
            await service.deleteSubCategory(id);
            setList(prev => prev.filter(crop => crop.id !== id));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (
       <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col-reverse md:flex-row mt-2 justify-between items-center">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Article Sub Categories</h1>
                        <p className="text-gray-600 mt-1">Manage your sub categories list</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.map((crop) => (
                                    <tr key={crop.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {crop.image ? (
                                                    <img
                                                        src={crop.image}
                                                        alt={crop.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No image</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{crop.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(crop.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(crop)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(crop.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {list.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No data found. Add your first crop to get started.
                        </div>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    Total Sub Categories: {list.length}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingItem ? 'Edit Crop' : 'Add New Crop'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image
                                    </label>
                                    <input
                                        type="file"
                                        accept='image/*'
                                        onChange={handleFile}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {imagePreview && (
                                        <div className="mt-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                                            <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                                            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">Select Category</option>
                                        {cats.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    {editingItem ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}