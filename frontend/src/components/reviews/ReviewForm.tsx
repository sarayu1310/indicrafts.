import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import StarRating from './StarRating';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

interface ReviewFormProps {
    productId: string;
    onReviewSubmitted?: () => void;
    onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    productId,
    onReviewSubmitted,
    onCancel,
}) => {
    const { isAuthenticated } = useAuth();
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isAuthenticated) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                        Please login to write a review
                    </p>
                    <Button onClick={onCancel} variant="outline">
                        Close
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 5MB`);
                return false;
            }
            return true;
        });

        const newImages = [...images, ...validFiles].slice(0, 5); // Max 5 images
        setImages(newImages);

        // Create previews
        const newPreviews = newImages.map((file) => URL.createObjectURL(file));
        setImagePreviews(newPreviews);
    };

    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        // Revoke object URLs to prevent memory leaks
        URL.revokeObjectURL(imagePreviews[index]);

        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (!title.trim()) {
            toast.error('Please enter a review title');
            return;
        }

        if (!comment.trim()) {
            toast.error('Please enter a review comment');
            return;
        }

        if (title.length > 200) {
            toast.error('Title must be less than 200 characters');
            return;
        }

        if (comment.length > 2000) {
            toast.error('Comment must be less than 2000 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('rating', rating.toString());
            formData.append('title', title.trim());
            formData.append('comment', comment.trim());

            // Append images
            images.forEach((image) => {
                formData.append('images', image);
            });

            await apiService.submitReview(formData);

            toast.success('Review submitted successfully!');

            // Reset form
            setRating(0);
            setTitle('');
            setComment('');
            setImages([]);
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
            setImagePreviews([]);

            if (onReviewSubmitted) {
                onReviewSubmitted();
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error?.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-merriweather">Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div>
                        <Label className="mb-2 block">Rating *</Label>
                        <StarRating
                            rating={rating}
                            onRatingChange={setRating}
                            interactive
                            size="lg"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <Label htmlFor="review-title">Review Title *</Label>
                        <Input
                            id="review-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your review a title"
                            maxLength={200}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {title.length}/200 characters
                        </p>
                    </div>

                    {/* Comment */}
                    <div>
                        <Label htmlFor="review-comment">Your Review *</Label>
                        <Textarea
                            id="review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={6}
                            maxLength={2000}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {comment.length}/2000 characters
                        </p>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <Label>Photos (Optional)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Upload up to 5 images (max 5MB each)
                        </p>
                        <div className="space-y-3">
                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove image"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Button */}
                            {images.length < 5 && (
                                <div>
                                    <input
                                        type="file"
                                        id="review-images"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="review-images"
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Add Photos</span>
                                        <ImageIcon className="h-4 w-4" />
                                    </Label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ReviewForm;

