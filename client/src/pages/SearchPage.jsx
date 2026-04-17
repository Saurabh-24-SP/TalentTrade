import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MapView from '../components/MapView';

const CATEGORIES = [
    'All', 'Technology', 'Education', 'Health & Wellness', 'Creative Arts',
    'Home Services', 'Business', 'Language', 'Music', 'Sports & Fitness',
    'Cooking & Food', 'Transportation', 'Legal', 'Financial',
];

const SORT_OPTIONS = [
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'rating', label: '⭐ Highest Rated' },
    { value: 'popular', label: '🔥 Most Popular' },
    { value: 'credits_asc', label: '💰 Credits: Low → High' },
    { value: 'credits_desc', label: '💰 Credits: High → Low' },
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [userLocation, setUserLocation] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const suggestTimeout = useRef(null);

    const [filters, setFilters] = useState({
        category: 'All',
        minCredits: '',
        maxCredits: '',
        minRating: '',
        sortBy: 'newest',
        nearMe: false,
        radius: 25,
    });

    // Search function
    const doSearch = useCallback(async (q, f, p = 1) => {
        setLoading(true);
        try {
            const params = {
                q: q || '',
                page: p,
                limit: 12,
                sortBy: f.sortBy,
                ...(f.category !== 'All' && { category: f.category }),
                ...(f.minCredits && { minCredits: f.minCredits }),
                ...(f.maxCredits && { maxCredits: f.maxCredits }),
                ...(f.minRating && { minRating: f.minRating }),
                ...(f.nearMe && userLocation && {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    radius: f.radius,
                }),
            };
            const { data } = await axios.get('/api/search', { params });
            if (data.success) {
                setServices(data.services);
                setTotal(data.pagination.total);
                setTotalPages(data.pagination.pages);
            }
        } catch (err) {
            // Fallback — BrowseServices se data lo
            try {
                const { data } = await axios.get('/api/services');
                const allServices = data.services || data || [];
                const filtered = q
                    ? allServices.filter(s =>
                        s.title?.toLowerCase().includes(q.toLowerCase()) ||
                        s.category?.toLowerCase().includes(q.toLowerCase())
                    )
                    : allServices;
                setServices(filtered);
                setTotal(filtered.length);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    }, [userLocation]);

    useEffect(() => {
        doSearch(query, filters, 1);
    }, [filters]);

    // Near me location
    useEffect(() => {
        if (!filters.nearMe) return;
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
                setFilters(f => ({ ...f, nearMe: false }));
                alert('Location access denied!');
            }
        );
    }, [filters.nearMe]);

    // Autocomplete suggestions
    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(suggestTimeout.current);
        if (val.length >= 2) {
            suggestTimeout.current = setTimeout(async () => {
                try {
                    const { data } = await axios.get(`/api/search/suggestions?q=${val}`);
                    setSuggestions(data.suggestions || []);
                    setShowSuggestions(true);
                } catch {
                    setSuggestions([]);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = (e) => {
        e?.preventDefault();
        setShowSuggestions(false);
        doSearch(query, filters, 1);
    };

    const updateFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

    const clearFilters = () => {
        setFilters({
            category: 'All', minCredits: '', maxCredits: '',
            minRating: '', sortBy: 'newest', nearMe: false, radius: 25,
        });
        setQuery('');
    };

    const activeFilterCount = [
        filters.category !== 'All', filters.minCredits,
        filters.maxCredits, filters.minRating, filters.nearMe,
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

            {/* Search Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <form onSubmit={handleSearch} className="flex gap-2 items-center flex-wrap">

                        {/* Search input */}
                        <div className="flex-1 relative min-w-[200px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Search services, skills..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {/* Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                    {suggestions.map((s, i) => (
                                        <button key={i} type="button"
                                            onMouseDown={() => { setQuery(s.text); setShowSuggestions(false); doSearch(s.text, filters, 1); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 flex items-center gap-3">
                                            <span className="text-xs text-violet-500 bg-violet-100 dark:bg-violet-900/30 rounded-full px-2 py-0.5 capitalize">{s.type}</span>
                                            <span className="text-gray-700 dark:text-gray-300 text-sm">{s.text}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit"
                            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                            Search
                        </button>

                        {/* Filters button */}
                        <button type="button" onClick={() => setShowFilters(v => !v)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-colors ${showFilters || activeFilterCount > 0
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                                }`}>
                            🔧 Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-violet-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* View toggle */}
                        <div className="flex border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                            {[['grid', '⊞'], ['list', '☰'], ['map', '🗺']].map(([mode, icon]) => (
                                <button key={mode} type="button" onClick={() => setViewMode(mode)}
                                    className={`px-3 py-2 text-sm transition-colors ${viewMode === mode ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}>
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </form>

                    {/* Filters panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <select value={filters.sortBy} onChange={e => updateFilter('sortBy', e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <input type="number" placeholder="Min credits" value={filters.minCredits}
                                    onChange={e => updateFilter('minCredits', e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <input type="number" placeholder="Max credits" value={filters.maxCredits}
                                    onChange={e => updateFilter('maxCredits', e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <select value={filters.minRating} onChange={e => updateFilter('minRating', e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    <option value="">Any rating</option>
                                    {[4.5, 4, 3.5, 3].map(r => <option key={r} value={r}>★ {r}+</option>)}
                                </select>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={filters.nearMe}
                                        onChange={e => updateFilter('nearMe', e.target.checked)}
                                        className="rounded text-violet-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">📍 Near me</span>
                                </label>
                            </div>

                            {/* Category pills */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => updateFilter('category', cat)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.category === cat
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-100'
                                            }`}>
                                        {cat}
                                    </button>
                                ))}
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters}
                                        className="px-3 py-1 rounded-full text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100">
                                        ✕ Clear all
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {loading ? 'Searching...' : (
                            <><span className="font-semibold text-gray-900 dark:text-white">{total}</span> services found
                                {query && <> for <span className="font-semibold">"{query}"</span></>}</>
                        )}
                    </p>
                </div>

                {viewMode === 'map' ? (
                    <MapView services={services} userLocation={userLocation} height="600px" />
                ) : loading ? (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No services found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Try changing your filters</p>
                        <button onClick={clearFilters}
                            className="bg-violet-600 text-white px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                        {services.map(service => (
                            <Link key={service._id} to={`/services/${service._id}`}
                                className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 ${viewMode === 'list' ? 'flex gap-4' : ''
                                    }`}>
                                {/* Image */}
                                <div className={`bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900 dark:to-purple-800 flex items-center justify-center ${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-48 w-full'
                                    }`}>
                                    {service.images?.[0]?.url ? (
                                        <img src={service.images[0].url} alt={service.title}
                                            className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">🛠️</span>
                                    )}
                                </div>
                                {/* Content */}
                                <div className="p-4 flex-1">
                                    <span className="text-xs text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                                        {service.category}
                                    </span>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mt-2 line-clamp-2">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                        {service.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-400">★</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {service.avgRating?.toFixed(1) || 'New'}
                                            </span>
                                        </div>
                                        <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold px-3 py-1 rounded-full text-sm">
                                            {service.creditCost || service.hoursRequired} credits
                                        </span>
                                    </div>
                                    {/* Provider */}
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
                                            {(service.providerInfo?.name || service.provider?.name || '?')[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {service.providerInfo?.name || service.provider?.name || 'Provider'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="flex justify-center gap-2 mt-8">
                        {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                            const p = i + 1;
                            return (
                                <button key={p} onClick={() => { setPage(p); doSearch(query, filters, p); }}
                                    className={`w-10 h-10 rounded-xl font-medium transition-colors ${p === page
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-violet-50'
                                        }`}>
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}