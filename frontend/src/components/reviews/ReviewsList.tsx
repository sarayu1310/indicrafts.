import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StarRating from './StarRating';
import { ThumbsUp, ThumbsDown, Image as ImageIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { toast } from 'sonner';

interface Review {
    _id: string;
    user: {
        _id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
    };
    userName: string;
    rating: number;
    title: string;
    comment: string;
    images: Array<{ url: string; publicId?: string }>;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulUsers?: string[];
    notHelpfulUsers?: string[];
    createdAt: string;
    updatedAt: string;
}

interface ReviewsListProps {
    productId: string;
    reviews: Review[];
    onHelpfulUpdate?: () => void;
    className?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
    productId,
    reviews,
    onHelpfulUpdate,
    className,
}) => {
    const { user } = useAuth();
    const [sortBy, setSortBy] = useState<string>('recent');
    const [updatingHelpful, setUpdatingHelpful] = useState<string | null>(null);

    const handleHelpfulClick = async (reviewId: string, isHelpful: boolean) => {
        if (!user) {
            toast.error('Please login to mark reviews as helpful');
            return;
        }

        setUpdatingHelpful(reviewId);
        try {
            await apiService.updateReviewHelpful(reviewId, isHelpful);
            if (onHelpfulUpdate) {
                onHelpfulUpdate();
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update helpful count');
        } finally {
            setUpdatingHelpful(null);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const hasUserVoted = (review: Review, isHelpful: boolean) => {
        if (!user) return false;
        const userId = user._id || user.id;
        if (isHelpful) {
            return review.helpfulUsers?.some((id) => id === userId) || false;
        } else {
            return review.notHelpfulUsers?.some((id) => id === userId) || false;
        }
    };

    const sortedReviews = [...reviews].sort((a, b) => {
        switch (sortBy) {
            case 'helpful':
                return b.helpfulCount - a.helpfulCount;
            case 'rating-high':
                return b.rating - a.rating;
            case 'rating-low':
                return a.rating - b.rating;
            case 'recent':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    if (reviews.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No reviews yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Be the first to review this product!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-merriweather text-2xl font-bold">
                    Customer Reviews ({reviews.length})
                </h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                        <SelectItem value="rating-high">Highest Rating</SelectItem>
                        <SelectItem value="rating-low">Lowest Rating</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Reviews */}
            <div className="space-y-6">
                {sortedReviews.map((review) => {
                    const userVotedHelpful = hasUserVoted(review, true);
                    const userVotedNotHelpful = hasUserVoted(review, false);
                    const isUpdating = updatingHelpful === review._id;

                    return (
                        <Card key={review._id}>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Review Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {getInitials(review.userName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{review.userName}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>

                                    {/* Review Title */}
                                    <div>
                                        <h4 className="font-semibold text-lg mb-1">{review.title}</h4>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {review.comment}
                                        </p>
                                    </div>

                                    {/* Review Images */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="grid grid-cols-5 gap-2">
                                            {review.images.map((image, index) => (
                                                <div
                                                    key={index}
                                                    className="relative aspect-square overflow-hidden rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => {
                                                        // Open image in modal or new tab
                                                        window.open(image.url, '_blank');
                                                    }}
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={`Review image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                                                        <ImageIcon className="h-4 w-4 text-white opacity-0 hover:opacity-100" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Helpful Buttons */}
                                    <div className="flex items-center gap-4 pt-2 border-t">
                                        <span className="text-sm text-muted-foreground">
                                            Was this review helpful?
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleHelpfulClick(review._id, true)}
                                                disabled={isUpdating}
                                                className={userVotedHelpful ? 'bg-primary/10 text-primary' : ''}
                                            >
                                                <ThumbsUp className="h-4 w-4 mr-1" />
                                                Yes ({review.helpfulCount})
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleHelpfulClick(review._id, false)}
                                                disabled={isUpdating}
                                                className={userVotedNotHelpful ? 'bg-destructive/10 text-destructive' : ''}
                                            >
                                                <ThumbsDown className="h-4 w-4 mr-1" />
                                                No ({review.notHelpfulCount})
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ReviewsList;

