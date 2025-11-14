import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, ShoppingCart, Plus, Minus, Star, MapPin, User, Truck, Shield, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart, buyNow } = useCart();
    const { isAuthenticated, user } = useAuth();

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const [product, setProduct] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewStats, setReviewStats] = useState<any>(null);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewTotal, setReviewTotal] = useState(0);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [userReview, setUserReview] = useState<any | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiService.getProductById(id!);
                const p: any = (res as any).product;
                if (!p) {
                    setProduct(null);
                } else {
                    setProduct({
                        id: p._id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        totalPrice: p.totalPrice,
                        priceBreakdown: p.priceBreakdown,
                        category: p.category,
                        image: p.imageUrl,
                        weight: p.weight,
                        location: p.location,
                        producer: {
                            name: p.producerName || 'Producer',
                            location: p.producerLocation || '—',
                        },
                        inStock: p.inStock,
                        quantity: p.quantity,
                    });
                }
            } catch (e) {
                setProduct(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Load reviews
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setReviewLoading(true);
                const res = await apiService.getProductReviews(id, { page: reviewPage, limit: 10 });
                const data: any = res as any;
                setReviews(data.reviews || []);
                setReviewStats(data.stats || null);
                setReviewTotal(data.pagination?.total || 0);
                
                // Check if current user has a review
                if (isAuthenticated && user) {
                    const userId = user._id || user.id;
                    const userRev = (data.reviews || []).find((r: any) => {
                        const reviewUserId = r.user?._id || r.user?.id;
                        return reviewUserId && userId && String(reviewUserId) === String(userId);
                    });
                    setUserReview(userRev || null);
                } else {
                    setUserReview(null);
                }
            } catch (e: any) {
                console.error('Failed to load reviews:', e);
            } finally {
                setReviewLoading(false);
            }
        })();
    }, [id, reviewPage, isAuthenticated, user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="font-merriweather text-2xl font-bold mb-4">Loading...</h1>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="font-merriweather text-2xl font-bold mb-4">Product Not Found</h1>
                    <p className="font-poppins text-muted-foreground mb-6">
                        The product you're looking for doesn't exist.
                    </p>
                    <Button onClick={() => navigate('/products')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Button>
                </div>
            </div>
        );
    }

    // Generate multiple product images for gallery
    const productImages = [product.image];

    // Check stock status
    const productQuantity = product.quantity ?? 0;
    const isOutOfStock = productQuantity === 0;
    const isLowStock = productQuantity > 0 && productQuantity <= 2;

    const handleAddToCart = () => {
        if (isOutOfStock) {
            toast.error('Product is out of stock');
            return;
        }
        if (quantity > productQuantity) {
            toast.error(`Only ${productQuantity} items available`);
            return;
        }
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        toast.success(`Added ${quantity} ${product.name} to cart`);
    };

    const handleWishlist = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to manage your wishlist');
            return;
        }
        try {
            if (isWishlisted) {
                await apiService.removeFromWishlist(product.id);
                setIsWishlisted(false);
                toast.success('Removed from wishlist');
            } else {
                await apiService.addToWishlist(product.id);
                setIsWishlisted(true);
                toast.success('Added to wishlist');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Wishlist update failed');
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: `Check out this beautiful ${product.name} from IndiCrafts`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Product link copied to clipboard');
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        const maxQuantity = productQuantity > 0 ? Math.min(productQuantity, 10) : 10;
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            setQuantity(newQuantity);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to continue with checkout');
            navigate('/login?redirect=/checkout');
            return;
        }

        if (isOutOfStock) {
            toast.error('Product is out of stock');
            return;
        }

        if (quantity > productQuantity) {
            toast.error(`Only ${productQuantity} items available`);
            return;
        }

        try {
            await buyNow(product, quantity);
            navigate('/checkout');
        } catch (error) {
            console.error('Error in buy now:', error);
            toast.error('Failed to proceed with buy now. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb */}
            <div className="bg-muted/30 py-4">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link to="/" className="text-muted-foreground hover:text-primary">Home</Link>
                        <span>/</span>
                        <Link to="/products" className="text-muted-foreground hover:text-primary">Products</Link>
                        <span>/</span>
                        <span className="text-primary">{product.category}</span>
                        <span>/</span>
                        <span className="font-medium">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left Side - Images */}
                    <div className="space-y-4">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        {/* Main Image */}
                        <div className="relative">
                            <div className="aspect-square overflow-hidden rounded-lg bg-gray-50 p-8 group">
                                <img
                                    src={productImages[selectedImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                        </div>

                        {/* Thumbnail Gallery */}
                        <div className="grid grid-cols-4 gap-3">
                            {productImages.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${selectedImageIndex === index
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={image}
                                        alt={`${product.name} view ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Product Details */}
                    <div className="space-y-6">
                        {/* Product Header */}
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="font-merriweather text-3xl font-bold text-primary">
                                    {product.name}
                                </h1>
                                <div className="flex space-x-2">
                                    {user?.role !== 'producer' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleWishlist}
                                            className={isWishlisted ? 'text-red-500' : 'text-gray-500'}
                                        >
                                            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={handleShare}>
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.floor(reviewStats?.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        ({reviewStats?.averageRating?.toFixed(1) || '0.0'}) • {reviewStats?.totalReviews || 0} {reviewStats?.totalReviews === 1 ? 'review' : 'reviews'}
                                    </span>
                                </div>
                                <Badge variant="secondary">{product.category}</Badge>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-muted/30 p-6 rounded-lg">
                            <div className="flex items-baseline space-x-3">
                                <span className="font-merriweather text-4xl font-bold text-primary">
                                    ₹{product.price.toLocaleString()}
                                </span>
                                <span className="text-xl text-muted-foreground line-through">
                                    ₹{(product.price * 1.2).toLocaleString()}
                                </span>
                                <Badge variant="destructive" className="text-sm">
                                    17% OFF
                                </Badge>
                            </div>
                            {/* Hide producer-to-hub breakdown from customers */}
                        </div>

                        {/* Producer Info */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-poppins font-semibold">{product.producer.name}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {product.producer.location}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quantity Selector */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-poppins font-semibold">Quantity</h3>
                                {isLowStock && !isOutOfStock && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                        Only {productQuantity} left!
                                    </Badge>
                                )}
                                {isOutOfStock && (
                                    <Badge className="bg-red-600 text-white text-xs">
                                        Out of Stock
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1 || isOutOfStock}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-poppins px-4 py-2 border rounded min-w-[60px] text-center">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= Math.min(productQuantity, 10) || isOutOfStock}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`w-full text-white ${isOutOfStock ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed' : 'bg-burnt-orange hover:bg-burnt-orange/90'}`}
                                size="lg"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                            >
                                Buy Now
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Free Shipping</p>
                                <p className="text-xs text-muted-foreground">Above ₹500</p>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">7-Day Returns</p>
                                <p className="text-xs text-muted-foreground">Easy exchange</p>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Secure Payment</p>
                                <p className="text-xs text-muted-foreground">100% safe</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Section */}
                <div className="mt-16 space-y-8">
                    <Separator />

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-merriweather text-2xl font-bold mb-4">Product Description</h3>
                            <p className="font-poppins text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-merriweather text-2xl font-bold mb-4">Key Features</h3>
                            <ul className="font-poppins text-muted-foreground space-y-2">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Handcrafted by skilled artisans using traditional techniques
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Made with sustainable and eco-friendly materials
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Unique and authentic design from rural communities
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Each piece tells a story of tradition and craftsmanship
                                </li>
                            </ul>
                        </div>
                    </div>

                    <Separator />

                    {/* Reviews Section */}
                    <div>
                        <h3 className="font-merriweather text-2xl font-bold mb-6">Customer Reviews</h3>
                        
                        {/* Review Stats */}
                        {reviewStats && reviewStats.totalReviews > 0 && (
                            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-4xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                                        <div className="flex items-center mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-5 w-5 ${i < Math.floor(reviewStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">{reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}</div>
                                    </div>
                                    <div className="flex-1 ml-8">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count = reviewStats.ratingDistribution?.[rating] || 0;
                                            const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                                            return (
                                                <div key={rating} className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm w-8">{rating}★</span>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add Review Form */}
                        {isAuthenticated && user?.role === 'customer' && !userReview && (
                            <Card className="mb-6 border-2 border-primary/30 bg-primary/5">
                                <CardContent className="p-6">
                                    {!showReviewForm ? (
                                        <div className="text-center space-y-3">
                                            <h4 className="font-semibold text-lg">Share Your Experience</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Help other customers by writing a review for this product
                                            </p>
                                            <Button onClick={() => setShowReviewForm(true)} variant="default" size="lg" className="mt-4">
                                                Write a Review
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Write a Review</h4>
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Rating</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => setReviewRating(rating)}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star
                                                                className={`h-6 w-6 ${rating <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
                                                <Textarea
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    placeholder="Share your experience with this product..."
                                                    rows={4}
                                                    maxLength={1000}
                                                />
                                                <div className="text-xs text-muted-foreground mt-1 text-right">
                                                    {reviewComment.length}/1000
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={async () => {
                                                        try {
                                                            setSubmittingReview(true);
                                                            await apiService.createReview(product.id, reviewRating, reviewComment);
                                                            toast.success('Review submitted successfully!');
                                                            setShowReviewForm(false);
                                                            setReviewComment('');
                                                            setReviewRating(5);
                                                            // Reload reviews
                                                            const res = await apiService.getProductReviews(id!, { page: 1, limit: 10 });
                                                            const data: any = res as any;
                                                            setReviews(data.reviews || []);
                                                            setReviewStats(data.stats || null);
                                                            setReviewTotal(data.pagination?.total || 0);
                                                            const userId = user._id || user.id;
                                                            const userRev = (data.reviews || []).find((r: any) => {
                                                                const reviewUserId = r.user?._id || r.user?.id;
                                                                return reviewUserId && userId && String(reviewUserId) === String(userId);
                                                            });
                                                            setUserReview(userRev || null);
                                                        } catch (e: any) {
                                                            toast.error(e?.message || 'Failed to submit review');
                                                        } finally {
                                                            setSubmittingReview(false);
                                                        }
                                                    }}
                                                    disabled={submittingReview}
                                                >
                                                    Submit Review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowReviewForm(false);
                                                        setReviewComment('');
                                                        setReviewRating(5);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* User's Existing Review */}
                        {isAuthenticated && user?.role === 'customer' && userReview && (
                            <Card className="mb-6 border-primary">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold mb-1">Your Review</h4>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < userReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                                {userReview.edited && (
                                                    <span className="text-xs text-muted-foreground ml-2">(Edited)</span>
                                                )}
                                            </div>
                                            {userReview.comment && (
                                                <p className="text-sm text-muted-foreground">{userReview.comment}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(userReview.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        const newRating = prompt('Enter new rating (1-5):', String(userReview.rating));
                                                        if (!newRating) return;
                                                        const rating = parseInt(newRating);
                                                        if (rating < 1 || rating > 5) {
                                                            toast.error('Rating must be between 1 and 5');
                                                            return;
                                                        }
                                                        const newComment = prompt('Enter new comment (optional):', userReview.comment || '');
                                                        await apiService.updateReview(userReview._id, rating, newComment || undefined);
                                                        toast.success('Review updated successfully!');
                                                        // Reload reviews
                                                        const res = await apiService.getProductReviews(id!, { page: reviewPage, limit: 10 });
                                                        const data: any = res as any;
                                                        setReviews(data.reviews || []);
                                                        setReviewStats(data.stats || null);
                                                        const userRev = (data.reviews || []).find((r: any) => r.user?._id === user._id || r.user?._id === user.id);
                                                        setUserReview(userRev || null);
                                                    } catch (e: any) {
                                                        toast.error(e?.message || 'Failed to update review');
                                                    }
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to delete your review?')) return;
                                                    try {
                                                        await apiService.deleteReview(userReview._id);
                                                        toast.success('Review deleted successfully!');
                                                        setUserReview(null);
                                                        // Reload reviews
                                                        const res = await apiService.getProductReviews(id!, { page: reviewPage, limit: 10 });
                                                        const data: any = res as any;
                                                        setReviews(data.reviews || []);
                                                        setReviewStats(data.stats || null);
                                                        setReviewTotal(data.pagination?.total || 0);
                                                    } catch (e: any) {
                                                        toast.error(e?.message || 'Failed to delete review');
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Login Prompt for Non-Authenticated Users */}
                        {!isAuthenticated && (
                            <Card className="mb-6 border-primary/20">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-4">
                                            Please login as a customer to review this product.
                                        </p>
                                        <Button onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}>
                                            Login to Review
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Role Check Message */}
                        {isAuthenticated && user?.role !== 'customer' && (
                            <Card className="mb-6 border-primary/20">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-muted-foreground">
                                            Only customers can review products. You are logged in as a {user?.role}.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reviews List */}
                        {reviewLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
                        ) : reviews.length === 0 && !userReview ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {isAuthenticated && user?.role === 'customer' 
                                    ? "No reviews yet. Be the first to review this product!"
                                    : "No reviews yet."
                                }
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews
                                    .filter((r) => !userReview || r._id !== userReview._id) // Don't show user's review in list if it exists
                                    .map((review) => (
                                        <Card key={review._id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-sm">
                                                                    {review.user?.firstName || review.user?.name || 'Anonymous'}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                        />
                                                                    ))}
                                                                    {review.edited && (
                                                                        <span className="text-xs text-muted-foreground ml-1">(Edited)</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                
                                {/* Pagination */}
                                {reviewTotal > 10 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                                            disabled={reviewPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            Page {reviewPage} of {Math.ceil(reviewTotal / 10)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setReviewPage((p) => p + 1)}
                                            disabled={reviewPage * 10 >= reviewTotal}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-merriweather text-2xl font-bold mb-4">Delivery & Returns</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-poppins font-semibold mb-2">Delivery Information</h4>
                                <ul className="font-poppins text-sm text-muted-foreground space-y-1">
                                    <li>• Free shipping on orders above ₹500</li>
                                    <li>• 3-5 business days delivery</li>
                                    <li>• Secure packaging to protect your items</li>
                                    <li>• Real-time tracking available</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-poppins font-semibold mb-2">Return Policy</h4>
                                <ul className="font-poppins text-sm text-muted-foreground space-y-1">
                                    <li>• 7-day return policy</li>
                                    <li>• Easy return process</li>
                                    <li>• Full refund on returns</li>
                                    <li>• Free return shipping</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
