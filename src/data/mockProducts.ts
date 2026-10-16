import type { Product } from '../types';

/**
 * Pizza Bite - Official Stall Menu Data
 * Transcribed directly from the official Pizza Bite Menu Board:
 * "Hot. Fresh. Delicious."
 * Instagram: @thepizzabitee
 */
export const INITIAL_PRODUCTS: Product[] = [
  // --- PIZZA ---
  {
    id: 'prod-corn-pizza',
    name: 'Corn Pizza',
    category: 'Pizza',
    price: 109,
    image: '/images/corn_pizza.jpg',
    description: 'Sweet corn, mozzarella cheese & pizza sauce.',
    available: true,
    isVeg: true,
    badge: 'Classic',
  },
  {
    id: 'prod-paneer-onion-pizza',
    name: 'Paneer & Onion Pizza',
    category: 'Pizza',
    price: 139,
    image: '/images/paneer_pizza.jpg',
    description: 'Paneer, onion, mozzarella cheese & pizza sauce.',
    available: true,
    isVeg: true,
    badge: 'Popular',
  },
  {
    id: 'prod-paneer-corn-pizza',
    name: 'Paneer & Corn Pizza',
    category: 'Pizza',
    price: 169,
    image: '/images/paneer_pizza.jpg',
    description: 'Paneer, sweet corn, mozzarella cheese & pizza sauce.',
    available: true,
    isVeg: true,
    badge: 'Bestseller',
  },
  {
    id: 'prod-farmhouse-pizza',
    name: 'Farmhouse Pizza',
    category: 'Pizza',
    price: 199,
    image: '/images/paneer_pizza.jpg',
    description: 'Paneer, onion, corn, black olive, jalapeno & pizza sauce.',
    available: true,
    isVeg: true,
    badge: "Chef's Special",
  },

  // --- BURGERS ---
  {
    id: 'prod-veg-burger',
    name: 'Veg Burger',
    category: 'Burgers',
    price: 49,
    image: '/images/veggie_burger.jpg',
    description: 'Veg patty, tomato, onion & mayo.',
    available: true,
    isVeg: true,
    badge: 'Crispy',
  },
  {
    id: 'prod-cheese-burger',
    name: 'Cheese Burger',
    category: 'Burgers',
    price: 69,
    image: '/images/veggie_burger.jpg',
    description: 'Veg patty, cheese, tomato, onion & mayo.',
    available: true,
    isVeg: true,
    badge: 'Must Try',
  },

  // --- SANDWICHES ---
  {
    id: 'prod-cheese-corn-sandwich',
    name: 'Cheese & Corn Sandwich',
    category: 'Sandwiches',
    price: 79,
    image: '/images/grilled_sandwich.jpg',
    description: 'Corn, cheese, mayo & spices.',
    available: true,
    isVeg: true,
    badge: 'Popular',
  },
  {
    id: 'prod-paneer-corn-cheese-sandwich',
    name: 'Paneer & Corn and Cheese Sandwich',
    category: 'Sandwiches',
    price: 109,
    image: '/images/grilled_sandwich.jpg',
    description: 'Paneer, corn, cheese, mayo & spices.',
    available: true,
    isVeg: true,
    badge: 'Loaded',
  },

  // --- FRIES ---
  {
    id: 'prod-peri-peri-fries-regular',
    name: 'Peri Peri Fries (Regular)',
    category: 'Fries',
    price: 59,
    image: '/images/french_fries.jpg',
    description: 'Fries tossed in spicy peri peri seasoning.',
    available: true,
    isVeg: true,
    badge: 'Spicy',
  },
  {
    id: 'prod-peri-peri-fries-large',
    name: 'Peri Peri Fries (Large)',
    category: 'Fries',
    price: 89,
    image: '/images/french_fries.jpg',
    description: 'Extra portion fries tossed in spicy peri peri seasoning.',
    available: true,
    isVeg: true,
    badge: 'Shareable',
  },

  // --- BEVERAGES ---
  {
    id: 'prod-cold-coffee',
    name: 'Cold Coffee',
    category: 'Beverages',
    price: 49,
    image: '/images/cold_coffee.jpg',
    description: 'Chilled coffee.',
    available: true,
    isVeg: true,
    badge: 'Sip Good Vibes',
  },
];
