// Mock data for the marketplace

export interface Product {
  id: string;
  slug?: string; // URL-friendly product identifier
  name: string;
  description: string;
  price: number;
  weight?: number; // in grams
  originalPrice?: number;
  shippingCost?: number;
  category: string;
  image: string;
  producer: {
    name: string;
    location: string;
  };
  inStock: boolean;
  quantity?: number; // product quantity available
  priceBreakdown?: {
    basePrice: number;
    shippingCost: number;
    totalPrice: number;
    shippingDetails: any;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'Handicrafts & Art',
    slug: 'handicrafts-art',
    description: 'Traditional paintings, sculptures, and decorative items'
  },
  {
    id: '2',
    name: 'Textiles & Apparel',
    slug: 'textiles-apparel',
    description: 'Handwoven fabrics, traditional clothing, and accessories'
  },
  {
    id: '3',
    name: 'Jewelry & Accessories',
    slug: 'jewelry-accessories',
    description: 'Handcrafted ornaments and traditional jewelry'
  },
  {
    id: '4',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Furniture, decor, and household items'
  },
  {
    id: '5',
    name: 'Food & Wellness',
    slug: 'food-wellness',
    description: 'Organic produce, spices, and traditional remedies'
  },
  {
    id: '6',
    name: 'Eco-Friendly Products',
    slug: 'eco-friendly',
    description: 'Sustainable and environmentally conscious items'
  },
  {
    id: '7',
    name: 'Cultural & Ritual Products',
    slug: 'cultural-ritual',
    description: 'Items for ceremonies and cultural practices'
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Handwoven Tribal Textile',
    description: 'Authentic handwoven fabric with traditional geometric patterns, made using age-old techniques passed down through generations.',
    price: 2499,
    category: 'textiles-apparel',
    image: '/src/assets/products/textile-1.jpg',
    producer: {
      name: 'Kamala Devi',
      location: 'Bastar, Chhattisgarh'
    },
    inStock: true
  },
  {
    id: '2',
    name: 'Silver Tribal Necklace',
    description: 'Oxidized silver necklace featuring traditional motifs and semi-precious stones, handcrafted by skilled artisans.',
    price: 3999,
    category: 'jewelry-accessories',
    image: '/src/assets/products/jewelry-1.jpg',
    producer: {
      name: 'Raman Bhai',
      location: 'Kutch, Gujarat'
    },
    inStock: true
  },
  {
    id: '3',
    name: 'Terracotta Pottery Set',
    description: 'Traditional clay pottery with hand-painted tribal patterns, perfect for serving and decoration.',
    price: 1899,
    category: 'home-living',
    image: '/src/assets/products/pottery-1.jpg',
    producer: {
      name: 'Sunita Kumari',
      location: 'Manipur'
    },
    inStock: true
  },
  {
    id: '4',
    name: 'Bamboo Woven Basket',
    description: 'Intricately woven bamboo basket with geometric patterns, eco-friendly and durable.',
    price: 899,
    category: 'eco-friendly',
    image: '/src/assets/products/bamboo-1.jpg',
    producer: {
      name: 'Mani Ram',
      location: 'Tripura'
    },
    inStock: true
  },
  {
    id: '5',
    name: 'Madhubani Painting',
    description: 'Original Madhubani artwork depicting mythological scenes with natural colors on handmade paper.',
    price: 4599,
    category: 'handicrafts-art',
    image: '/src/assets/products/textile-1.jpg',
    producer: {
      name: 'Bharti Dayal',
      location: 'Madhubani, Bihar'
    },
    inStock: true
  },
  {
    id: '6',
    name: 'Organic Forest Honey',
    description: 'Pure wild honey collected from forest beehives using traditional sustainable methods.',
    price: 599,
    category: 'food-wellness',
    image: '/src/assets/products/pottery-1.jpg',
    producer: {
      name: 'Forest Collective',
      location: 'Sundarbans, West Bengal'
    },
    inStock: true
  }
];