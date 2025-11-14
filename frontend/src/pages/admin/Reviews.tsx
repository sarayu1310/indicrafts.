import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { Star, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | ''>('');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadReviews();
    }, [page, search, ratingFilter]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const params: any = { page, limit };
            if (search) params.search = search;
            if (ratingFilter) params.rating = ratingFilter;
            const res = await api.getAdminReviews(params);
            const data: any = res as any;
            setReviews(data.reviews || []);
            setTotal(data.total || 0);
            setStats(data.stats || null);
        } catch (e: any) {
            setError(e?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }
        try {
            await api.deleteAdminReview(reviewId);
            toast.success('Review deleted successfully');
            loadReviews();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete review');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Reviews</h1>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Reviews</div>
                            <div className="text-2xl font-bold">{stats.totalReviews}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Average Rating</div>
                            <div className="text-2xl font-bold">
                                {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < Math.floor(stats.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">5 Star Reviews</div>
                            <div className="text-2xl font-bold">{stats.ratingDistribution?.[5] || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">1 Star Reviews</div>
                            <div className="text-2xl font-bold">{stats.ratingDistribution?.[1] || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                                placeholder="Search in comments..."
                                value={search}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                className="border rounded-md px-3 py-2 text-sm"
                                value={ratingFilter}
                                onChange={(e) => {
                                    setPage(1);
                                    setRatingFilter(e.target.value === '' ? '' : Number(e.target.value));
                                }}
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Reviews Table */}
            <div className="overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-3">Product</th>
                            <th className="text-left p-3">Customer</th>
                            <th className="text-left p-3">Rating</th>
                            <th className="text-left p-3">Comment</th>
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
                        ) : reviews.length === 0 ? (
                            <tr><td className="p-4" colSpan={6}>No reviews found</td></tr>
                        ) : (
                            reviews.map((review) => (
                                <tr key={review._id} className="border-t">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {review.product?.imageUrl && (
                                                <img
                                                    src={review.product.imageUrl}
                                                    alt={review.product.name}
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                            )}
                                            <div>
                                                <Link
                                                    to={`/product/${review.product?._id || review.product?.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {review.product?.name || 'Unknown Product'}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">
                                                    {review.product?.category || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div>
                                            <div className="font-medium">
                                                {review.user?.firstName || review.user?.name || 'Anonymous'}
                                                {review.user?.lastName && ` ${review.user.lastName}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {review.user?.email || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                />
                                            ))}
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                ({review.rating})
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="max-w-md">
                                            {review.comment ? (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {review.comment}
                                                </p>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No comment</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-xs text-muted-foreground">
                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                                        </div>
                                        {review.edited && (
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                Edited
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(review._id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
                <div>{total} total reviews</div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Previous
                    </Button>
                    <div>Page {page} of {Math.ceil(total / limit)}</div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page * limit >= total}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;

