import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from './StarRating';
import { Progress } from '@/components/ui/progress';

interface RatingBreakdownProps {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    className?: string;
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
    averageRating,
    totalReviews,
    ratingBreakdown,
    className,
}) => {
    const getPercentage = (count: number) => {
        if (totalReviews === 0) return 0;
        return (count / totalReviews) * 100;
    };

    const getStarLabel = (stars: number) => {
        return `${stars}★`;
    };

    return (
        <Card className={className}>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Overall Rating */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="font-merriweather text-5xl font-bold text-primary">
                                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                            </span>
                            <div className="flex flex-col">
                                <StarRating
                                    rating={Math.round(averageRating)}
                                    size="md"
                                    showLabel={false}
                                />
                                <span className="text-sm text-muted-foreground mt-1">
                                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rating Breakdown Bars */}
                    {totalReviews > 0 ? (
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = ratingBreakdown[stars as keyof typeof ratingBreakdown];
                                const percentage = getPercentage(count);
                                return (
                                    <div key={stars} className="flex items-center gap-3">
                                        <div className="w-12 text-sm font-medium text-right">
                                            {getStarLabel(stars)}
                                        </div>
                                        <div className="flex-1">
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                        <div className="w-16 text-sm text-muted-foreground text-right">
                                            {count} ({percentage.toFixed(0)}%)
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No reviews yet</p>
                            <p className="text-sm mt-1">Be the first to review this product!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RatingBreakdown;

