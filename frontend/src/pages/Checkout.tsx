import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, CreditCard, CheckCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import AddressForm from '@/components/checkout/AddressForm';
import { AddressData } from '@/services/locationService';
import api from '@/services/api';
import shippingService from '@/services/shippingService';

const Checkout: React.FC = () => {
    const { items, totalItems, totalPrice, deliveryAddress, setDeliveryAddress, clearCart, setCheckoutComplete } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'confirmation'>('address');
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerShipping, setCustomerShipping] = useState<number>(0);

    // Calculate total weight rate from all items
    const totalWeightRate = items.reduce((sum, item) => {
        const priceBreakdown = (item as any).priceBreakdown?.shippingDetails;
        const approvedBreakdown = (item as any).approvedPriceBreakdown?.shippingDetails;
        const shippingDetails = priceBreakdown || approvedBreakdown;

        // Try baseCost first, then breakdown.baseRate as fallback
        const weightRate = shippingDetails?.baseCost ??
            shippingDetails?.breakdown?.baseRate ?? 0;
        return sum + (weightRate * (item.quantity || 1));
    }, 0);

    // Recalculate customer delivery shipping when address or cart changes
    useEffect(() => {
        const calc = async () => {
            try {
                if (!deliveryAddress) {
                    setCustomerShipping(0);
                    return;
                }

                // Use coordinates if available, otherwise use address text for geocoding
                let customerLocation = deliveryAddress.location;

                // If no coordinates, try to get them from address text
                if (!customerLocation?.latitude || !customerLocation?.longitude) {
                    try {
                        // Use a simple geocoding approach - in production, use a proper geocoding service
                        const addressString = `${deliveryAddress.city}, ${deliveryAddress.state}, India`;
                        console.log('Attempting to get coordinates for:', addressString);

                        // For now, use a fallback based on city/state
                        // In production, integrate with Google Maps API or similar
                        const fallbackCoords = getFallbackCoordinates(deliveryAddress.city, deliveryAddress.state);
                        if (fallbackCoords) {
                            customerLocation = {
                                latitude: fallbackCoords.latitude,
                                longitude: fallbackCoords.longitude,
                                address: `${deliveryAddress.city}, ${deliveryAddress.state}`,
                                city: deliveryAddress.city,
                                state: deliveryAddress.state,
                                country: deliveryAddress.country || 'India'
                            };
                        }
                    } catch (e) {
                        console.warn('Could not get coordinates:', e);
                    }
                }

                if (!customerLocation?.latitude || !customerLocation?.longitude) {
                    // If we have a postal code, let the backend geocode it and calculate shipping
                    if (deliveryAddress?.postalCode) {
                        // continue and call backend with postal code
                        customerLocation = null;
                    } else {
                        // Use a default shipping cost if no coordinates or postal code available
                        setCustomerShipping(calculateFallbackShipping());
                        return;
                    }
                }

                let totalShip = 0;
                console.log('Calculating shipping for items:', items.length);
                for (const item of items) {
                    let weight = Number((item as any).weight || 0);
                    console.log('Item weight (from cart):', weight, 'Item:', item.name);

                    // If weight is missing in cart, try to fetch product details from server for this item
                    if (!weight && item.id) {
                        try {
                            console.log('Fetching product details for item to obtain weight:', item.id);
                            const prodRes: any = await api.getProductById(item.id);
                            const prod = prodRes?.product;
                            if (prod && prod.weight) {
                                weight = Number(prod.weight);
                                console.log('Fetched weight for item:', weight);
                            }
                        } catch (e) {
                            console.warn('Failed to fetch product details for weight fallback:', e);
                        }
                    }

                    console.log('Using weight for calculation:', weight, 'Item:', item.name);
                    if (weight > 0) {
                        try {
                            // If we have coordinates, pass them; otherwise pass postal code string
                            const locationArg = (customerLocation && customerLocation.latitude && customerLocation.longitude)
                                ? customerLocation
                                : (deliveryAddress?.postalCode || undefined);

                            // Log request body for debugging
                            const debugRequestBody = typeof locationArg === 'string'
                                ? { basePrice: Number(item.originalPrice ?? item.price), weight, customerPostalCode: locationArg }
                                : { basePrice: Number(item.originalPrice ?? item.price), weight, customerLocation: locationArg };
                            console.log('Shipping request body:', debugRequestBody);

                            const resp = await shippingService.calculateCustomerPrice(
                                Number(item.originalPrice ?? item.price),
                                weight,
                                locationArg
                            );
                            console.log('Shipping response:', resp);
                            // Use only the distance surcharge (customer-facing delivery surcharge) — do NOT include the producer->hub base weight rate
                            const distanceCharge = Number(
                                resp?.breakdown?.shipping?.breakdown?.distanceCharge ??
                                resp?.breakdown?.shipping?.distanceSurcharge ??
                                0
                            );
                            console.log('Using distanceCharge for shipping aggregation:', distanceCharge);
                            const itemShipping = distanceCharge * Number(item.quantity || 1);
                            totalShip += itemShipping;
                            console.log('Item shipping cost:', itemShipping);
                        } catch (error) {
                            console.error('Error calculating shipping for item:', error);
                        }
                    } else {
                        console.log('No weight for item:', item.name);
                    }
                }
                console.log('Total shipping calculated:', totalShip);
                setCustomerShipping(Math.max(Math.round(totalShip), 0));
            } catch (error) {
                console.error('Shipping calculation error:', error);
                setCustomerShipping(calculateFallbackShipping());
            }
        };
        calc();
    }, [deliveryAddress, items]);

    // Fallback coordinates for major Indian cities
    const getFallbackCoordinates = (city: string, state: string) => {
        const cityCoords: Record<string, { latitude: number; longitude: number }> = {
            'Chennai': { latitude: 13.0827, longitude: 80.2707 },
            'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
            'Delhi': { latitude: 28.7041, longitude: 77.1025 },
            'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
            'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
            'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
            'Pune': { latitude: 18.5204, longitude: 73.8567 },
            'Ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
            'Jaipur': { latitude: 26.9124, longitude: 75.7873 },
            'Surat': { latitude: 21.1702, longitude: 72.8311 },
        };

        const normalizedCity = city?.toLowerCase().trim();
        for (const [key, coords] of Object.entries(cityCoords)) {
            if (normalizedCity?.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCity || '')) {
                return coords;
            }
        }
        return null;
    };

    // Calculate fallback shipping when coordinates aren't available
    const calculateFallbackShipping = () => {
        let totalWeight = 0;
        for (const item of items) {
            const weight = Number((item as any).weight || 0);
            totalWeight += weight * (item.quantity || 1);
        }

        // Simple weight-based shipping calculation
        if (totalWeight <= 100) return 50;
        if (totalWeight <= 500) return 80;
        if (totalWeight <= 1000) return 120;
        if (totalWeight <= 2000) return 180;
        return 250;
    };

    // Check authentication on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to continue with checkout');
            navigate('/login?redirect=/checkout');
            return;
        }
    }, [isAuthenticated, navigate]);

    // Show loading if checking authentication
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background py-12">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                    <Card>
                        <CardContent className="py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="font-poppins text-muted-foreground">Redirecting to login...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Redirect if cart is empty
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background py-12">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                    <Card>
                        <CardContent className="py-12">
                            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h2 className="font-merriweather text-2xl font-bold mb-4">Your cart is empty</h2>
                            <p className="font-poppins text-muted-foreground mb-6">
                                Add some products to your cart before checkout
                            </p>
                            <Button onClick={() => navigate('/')} className="bg-burnt-orange hover:bg-burnt-orange/90">
                                Continue Shopping
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const handleAddressSubmit = (address: AddressData) => {
        setDeliveryAddress(address);
        setCurrentStep('payment');
        toast.success('Address saved successfully!');
    };

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const ok = await loadRazorpayScript();
            if (!ok) {
                toast.error('Failed to load Razorpay. Check your network.');
                setIsProcessing(false);
                return;
            }

            // 1. Get key
            const { keyId } = await api.getRazorpayKey();

            // 2. Create order on backend (amount in paise)
            const amountPaise = Math.round((totalPrice + customerShipping + totalWeightRate) * 100);
            const order = await api.createPaymentOrder({ amount: amountPaise });

            // 3. Open Razorpay Checkout
            const options: any = {
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'IndiCrafts',
                description: 'Order Payment',
                order_id: order.id,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: deliveryAddress?.phone || '',
                },
                notes: {
                    address: `${deliveryAddress?.addressLine1 || ''} ${deliveryAddress?.city || ''}`,
                },
                handler: async function (response: any) {
                    try {
                        // 4. Verify and record order on backend
                        const cartPayload = {
                            items: items.map((it) => ({ id: it.id, name: it.name, price: it.price, quantity: it.quantity, image: it.image })),
                        };
                        const totals = {
                            subtotal: totalPrice,
                            shipping: customerShipping,
                            weightRate: totalWeightRate,
                            total: totalPrice + customerShipping + totalWeightRate
                        };

                        // Debug log exact payload sent to confirmPayment
                        console.log('ConfirmPayment payload:', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            cart: cartPayload,
                            address: deliveryAddress,
                            totals,
                            currency: order.currency,
                        });

                        await api.confirmPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            cart: cartPayload,
                            address: deliveryAddress,
                            totals,
                            currency: order.currency,
                        });
                        setCheckoutComplete(true);
                        setCurrentStep('confirmation');
                        clearCart();
                        toast.success('Payment successful!');
                    } catch (e: any) {
                        toast.error(e?.message || 'Payment confirmation failed');
                    }
                },
                theme: { color: '#C45527' },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (e: any) {
            toast.error(e?.message || 'Payment failed to initialize');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const renderAddressStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="font-merriweather text-2xl font-bold mb-2">Delivery Address</h2>
                <p className="font-poppins text-muted-foreground">
                    Please provide your delivery address to continue
                </p>
            </div>

            <AddressForm
                onAddressSubmit={handleAddressSubmit}
                initialAddress={deliveryAddress || undefined}
                isLoading={isProcessing}
                onLocationResolved={(partial) => {
                    // Merge partial resolved location into deliveryAddress so shipping recalculation runs
                    const merged = {
                        ...(deliveryAddress || {}),
                        ...partial,
                    } as any;
                    // Ensure location typed correctly
                    if (partial.location) merged.location = partial.location;
                    setDeliveryAddress(merged);
                }}
            />
        </div>
    );

    const renderPaymentStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="font-merriweather text-2xl font-bold mb-2">Payment Details</h2>
                <p className="font-poppins text-muted-foreground">
                    Review your order and complete payment
                </p>
            </div>

            {/* Order Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-merriweather flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Order Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                    <div>
                                        <h4 className="font-poppins font-medium">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <span className="font-poppins font-medium">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-poppins">Items Total</span>
                                <span className="font-poppins">₹{totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-poppins">Shipping to your address</span>
                                <span className="font-poppins">₹{customerShipping.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-poppins">Weight Rate</span>
                                <span className="font-poppins">₹{totalWeightRate.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                                <span className="font-poppins font-medium">Order Total</span>
                                <span className="font-merriweather text-xl font-bold text-primary">₹{(totalPrice + customerShipping + totalWeightRate).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Product prices already include producer-to-hub shipping • Additional line is delivery to your address
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Address Display */}
            {deliveryAddress && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-merriweather flex items-center text-lg">
                            <MapPin className="h-5 w-5 mr-2" />
                            Delivery Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-poppins text-sm space-y-1">
                            <p><strong>{deliveryAddress.fullName}</strong></p>
                            <p>{deliveryAddress.phone}</p>
                            <p>{deliveryAddress.addressLine1}</p>
                            {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
                            <p>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.postalCode}</p>
                            <p>{deliveryAddress.country}</p>
                            {deliveryAddress.landmark && <p>Landmark: {deliveryAddress.landmark}</p>}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentStep('address')}
                            className="mt-3"
                        >
                            Change Address
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-merriweather flex items-center text-lg">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Payment Method
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <input type="radio" id="online" name="payment" value="online" defaultChecked />
                            <label htmlFor="online" className="font-poppins">Razorpay (Card/UPI/Netbanking)</label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-60">
                            <input type="radio" id="cod" name="payment" value="cod" disabled />
                            <label htmlFor="cod" className="font-poppins">Cash on Delivery (Disabled in test)</label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep('address')}
                    className="flex-1"
                >
                    Back to Address
                </Button>
                <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-burnt-orange hover:bg-burnt-orange/90"
                >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Place Order
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    const renderConfirmationStep = () => (
        <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div>
                <h2 className="font-merriweather text-2xl font-bold mb-2">Order Confirmed!</h2>
                <p className="font-poppins text-muted-foreground">
                    Thank you for your order. We'll send you a confirmation email shortly.
                </p>
            </div>

            <Card>
                <CardContent className="py-6">
                    <div className="space-y-2">
                        <p className="font-poppins"><strong>Order Total:</strong> ₹{(totalPrice + customerShipping + totalWeightRate).toLocaleString()}</p>
                        <p className="font-poppins"><strong>Payment Method:</strong> Cash on Delivery</p>
                        <p className="font-poppins"><strong>Estimated Delivery:</strong> 3-5 business days</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex space-x-4">
                <Button
                    variant="outline"
                    onClick={handleContinueShopping}
                    className="flex-1"
                >
                    Continue Shopping
                </Button>
                <Button
                    onClick={() => navigate('/orders')}
                    className="flex-1 bg-burnt-orange hover:bg-burnt-orange/90"
                >
                    View Orders
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                        <div className={`flex items-center ${currentStep === 'address' ? 'text-primary' : currentStep === 'payment' || currentStep === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'address' ? 'bg-primary text-white' : currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                                1
                            </div>
                            <span className="ml-2 font-poppins font-medium">Address</span>
                        </div>

                        <div className={`w-8 h-1 ${currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-primary' : 'bg-muted'}`}></div>

                        <div className={`flex items-center ${currentStep === 'payment' ? 'text-primary' : currentStep === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-primary text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                                2
                            </div>
                            <span className="ml-2 font-poppins font-medium">Payment</span>
                        </div>

                        <div className={`w-8 h-1 ${currentStep === 'confirmation' ? 'bg-primary' : 'bg-muted'}`}></div>

                        <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                                3
                            </div>
                            <span className="ml-2 font-poppins font-medium">Confirmation</span>
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                {currentStep === 'address' && renderAddressStep()}
                {currentStep === 'payment' && renderPaymentStep()}
                {currentStep === 'confirmation' && renderConfirmationStep()}
            </div>
        </div>
    );
};

export default Checkout;
