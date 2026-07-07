import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Folder, MoreVertical, Edit, Trash2, Pin, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { useStore, Notebook, NotebookFolder } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotebooksPage() {
  const notebooks = useStore((state) => state.notebooks);
  const notebookFolders = useStore((state) => state.notebookFolders);
  const addNotebook = useStore((state) => state.addNotebook);
  const updateNotebook = useStore((state) => state.updateNotebook);
  const deleteNotebook = useStore((state) => state.deleteNotebook);
  const setActiveNotebookId = useStore((state) => state.setActiveNotebookId);
  const addNotebookFolder = useStore((state) => state.addNotebookFolder);
  const deleteNotebookFolder = useStore((state) => state.deleteNotebookFolder);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);

  const filteredNotebooks = notebooks.filter(nb =>
    nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nb.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) return;
    
    const newNotebook: Notebook = {
      id: `notebook_${Date.now()}`,
      title: newNotebookTitle,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addNotebook(newNotebook);
    setNewNotebookTitle('');
    setShowNewNotebook(false);
    setSelectedNotebook(newNotebook);
    setActiveNotebookId(newNotebook.id);
  };

  const handleUpdateNotebook = async (updates: Partial<Notebook>) => {
    if (!selectedNotebook) return;
    updateNotebook(selectedNotebook.id, updates);
    setSelectedNotebook({ ...selectedNotebook, ...updates, updatedAt: new Date().toISOString() });
  };

  const handleDeleteNotebook = async (id: string) => {
    if (confirm('Are you sure you want to delete this notebook?')) {
      deleteNotebook(id);
      if (selectedNotebook?.id === id) {
        setSelectedNotebook(null);
        setActiveNotebookId(null);
      }
    }
  };

  const handleCreateFolder = () => {
    const newFolder: NotebookFolder = {
      id: `folder_${Date.now()}`,
      name: 'New Folder',
      createdAt: new Date().toISOString(),
    };
    addNotebookFolder(newFolder);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Notebooks</h2>
            <button
              onClick={() => setShowNewNotebook(!showNewNotebook)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New notebook"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <AnimatePresence>
          {showNewNotebook && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 border-b border-gray-200"
            >
              <input
                type="text"
                placeholder="Notebook title..."
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNotebook()}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreateNotebook}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewNotebook(false)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Folders */}
          {notebookFolders.length > 0 && (
            <div className="mb-4">
              <button
                onClick={handleCreateFolder}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <Plus className="h-4 w-4" />
                New folder
              </button>
              {notebookFolders.map(folder => (
                <div key={folder.id}>
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4" />
                    <span className="flex-1 text-left">{folder.name}</span>
                  </button>
                  {expandedFolders.has(folder.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {notebooks.filter(nb => nb.folderId === folder.id).map(notebook => (
                        <button
                          key={notebook.id}
                          onClick={() => setSelectedNotebook(notebook)}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm ${
                            selectedNotebook?.id === notebook.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span className="flex-1 text-left truncate">{notebook.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notebooks without folder */}
          <div className="space-y-1">
            {filteredNotebooks.filter(nb => !nb.folderId).map(notebook => (
              <button
                key={notebook.id}
                onClick={() => setSelectedNotebook(notebook)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm ${
                  selectedNotebook?.id === notebook.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span className="flex-1 text-left truncate">{notebook.title}</span>
                {notebook.isPinned && <Pin className="h-3 w-3 text-gray-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNotebook ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => {
                        handleUpdateNotebook({ title: editingTitle });
                        setIsEditing(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateNotebook({ title: editingTitle });
                          setIsEditing(false);
                        }
                      }}
                      className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none flex-1"
                      autoFocus
                    />
                  ) : (
                    <h1
                      onClick={() => {
                        setEditingTitle(selectedNotebook.title);
                        setIsEditing(true);
                      }}
                      className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      {selectedNotebook.title}
                    </h1>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateNotebook({ isPinned: !selectedNotebook.isPinned })}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedNotebook.isPinned ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                    title={selectedNotebook.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotebook(selectedNotebook.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Last updated {formatDistanceToNow(new Date(selectedNotebook.updatedAt), { addSuffix: true })}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-6">
              <textarea
                value={selectedNotebook.content}
                onChange={(e) => handleUpdateNotebook({ content: e.target.value })}
                placeholder="Start writing your notes..."
                className="w-full h-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Select a notebook to view</p>
              <p className="text-sm">Or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
