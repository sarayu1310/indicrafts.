import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/lib/data';
import { AddressData } from '@/services/locationService';
import { toast } from 'sonner';
import apiService from '@/services/api';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity: number) => Promise<void>;
  totalItems: number;
  totalPrice: number;
  // Address and checkout related
  deliveryAddress: AddressData | null;
  setDeliveryAddress: (address: AddressData | null) => void;
  isCheckoutComplete: boolean;
  setCheckoutComplete: (complete: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData | null>(null);
  const [isCheckoutComplete, setCheckoutComplete] = useState(false);

  const addToCart = (product: Product) => {
    // If the product doesn't include weight (or weight is 0), attempt to fetch full product details
    const ensureAndAdd = async () => {
      try {
        let prodToAdd: any = product;
        if (!product.weight || product.weight === 0) {
          try {
            const res: any = await apiService.getProductById(product.id);
            const p = res?.product;
            if (p) {
              prodToAdd = {
                id: p._id,
                name: p.name,
                description: p.description,
                price: p.price,
                weight: p.weight,
                originalPrice: p.originalPrice,
                shippingCost: p.shippingCost,
                category: p.category,
                image: p.imageUrl,
                producer: {
                  name: p.producerName || 'Producer',
                  location: p.producerLocation || '—',
                },
                inStock: p.inStock,
                priceBreakdown: p.priceBreakdown,
              };
            }
          } catch (e) {
            // ignore fetch failures; we'll add the product as-is
            console.warn('Failed to fetch full product details for cart; using provided object', e);
          }
        }

        setItems(currentItems => {
          const existingItem = currentItems.find(item => item.id === prodToAdd.id);

          if (existingItem) {
            toast.success(`Updated quantity of ${prodToAdd.name} in cart`);
            return currentItems.map(item =>
              item.id === prodToAdd.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }

          toast.success(`Added ${prodToAdd.name} to cart`);
          return [...currentItems, { ...prodToAdd, quantity: 1 }];
        });
      } catch (err) {
        console.error('Error adding to cart:', err);
        // fallback: add the original product object
        setItems(currentItems => {
          const existingItem = currentItems.find(item => item.id === product.id);
          if (existingItem) {
            toast.success(`Updated quantity of ${product.name} in cart`);
            return currentItems.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          toast.success(`Added ${product.name} to cart`);
          return [...currentItems, { ...product, quantity: 1 }];
        });
      }
    };

    // fire-and-forget; UI already shows toast, so no need to await
    ensureAndAdd();
  };

  const removeFromCart = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.id === productId);
      if (item) {
        toast.success(`Removed ${item.name} from cart`);
      }
      return currentItems.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryAddress(null);
    setCheckoutComplete(false);
    toast.success('Cart cleared');
  };

  const buyNow = async (product: Product, quantity: number) => {
    // Clear cart first
    setItems([]);
    setDeliveryAddress(null);
    setCheckoutComplete(false);

    // Fetch full product details if needed
    let prodToAdd: any = product;
    if (!product.weight || product.weight === 0) {
      try {
        const res: any = await apiService.getProductById(product.id);
        const p = res?.product;
        if (p) {
          prodToAdd = {
            id: p._id,
            name: p.name,
            description: p.description,
            price: p.price,
            weight: p.weight,
            originalPrice: p.originalPrice,
            shippingCost: p.shippingCost,
            category: p.category,
            image: p.imageUrl,
            producer: {
              name: p.producerName || 'Producer',
              location: p.producerLocation || '—',
            },
            inStock: p.inStock,
            priceBreakdown: p.priceBreakdown,
          };
        }
      } catch (e) {
        console.warn('Failed to fetch full product details for buy now; using provided object', e);
      }
    }

    // Add product with specified quantity
    setItems([{ ...prodToAdd, quantity }]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNow,
        totalItems,
        totalPrice,
        deliveryAddress,
        setDeliveryAddress,
        isCheckoutComplete,
        setCheckoutComplete
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};