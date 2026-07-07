import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Grid, List, Bookmark, FileText, Clock, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'saved' | 'bookmarked' | 'recent';
type ViewMode = 'grid' | 'list';

export default function LibraryPage() {
  const sessions = useStore((state) => state.sessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'favorites'>('date');

  const filteredSessions = sessions
    .filter(session => {
      const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'saved' && session.isPinned) ||
        (filterType === 'bookmarked' && session.isFavorite) ||
        (filterType === 'recent');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'favorites') return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      return 0;
    });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'favorites')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="favorites">Sort by Favorites</option>
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('saved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === 'saved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bookmark className="h-4 w-4 inline mr-1" />
            Saved
          </button>
          <button
            onClick={() => setFilterType('bookmarked')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === 'bookmarked' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="h-4 w-4 inline mr-1" />
            Bookmarked
          </button>
          <button
            onClick={() => setFilterType('recent')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-1" />
            Recent
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm">Your saved conversations and files will appear here</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1">{session.title}</h3>
                  {session.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {session.messages[session.messages.length - 1]?.content || 'No messages yet'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{session.messages.length} messages</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    {session.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    {session.isPinned && <Bookmark className="h-4 w-4 text-blue-500 fill-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {session.messages[session.messages.length - 1]?.content || 'No messages yet'}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</div>
                  <div className="text-xs">{session.messages.length} messages</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
