
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, CheckCircle, Loader2 } from 'lucide-react';
import service from '../../services/farmerService';

export const UserSearchSelect = ({ onSelect, selectedUser = null, placeholder = "Search users..." }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers(searchQuery);
            } else {
                setUsers([]);
                setIsOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchUsers = async (query) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await service.getSearchUsers(query);
            const userList = response.data?.farmers || [];
            setUsers(userList);
            setIsOpen(true);
        } catch (err) {
            setError(err.message);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        onSelect(user);
        setSearchQuery('');
        setIsOpen(false);
        setUsers([]);
    };

    const handleClearSelection = () => {
        onSelect(null);
        setSearchQuery('');
        inputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
        if (!e.target.value.trim()) {
            setUsers([]);
            setIsOpen(false);
        }
    };

    return (
        <div className="w-full" ref={dropdownRef}>
            {selectedUser ? (
                <div className="bg-white border-2 border-green-500 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            {selectedUser.image ? (
                                <img
                                    src={selectedUser.image}
                                    alt={selectedUser.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-green-600" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{selectedUser.name}</h3>
                                    {selectedUser.isEmailVerified && (
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{selectedUser.email}</p>
                                {selectedUser.isCoder && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        Coder
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleClearSelection}
                            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Clear selection"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={handleInputChange}
                                placeholder={placeholder}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            {isLoading && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500 animate-spin" />
                            )}
                        </div>
                        {isOpen && (
                            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                {error && (
                                    <div className="p-4 text-center text-red-600">
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                {!error && users.length === 0 && !isLoading && (
                                    <div className="p-4 text-center text-gray-500">
                                        <p className="text-sm">No users found</p>
                                    </div>
                                )}

                                {!error && users.length > 0 && (
                                    <ul className="divide-y divide-gray-100">
                                        {users.map((user) => (
                                            <li
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="p-3 hover:bg-green-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                                                          
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};