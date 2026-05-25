import type { Product, Transaction, Stat } from '../types';

export const categories = ['All', 'Food', 'Drinks', 'Snacks', 'Desserts'];

export const mockProducts: Product[] = [
{
  id: '1',
  name: 'Avocado Toast',
  category: 'Food',
  price: 8.5,
  stock: 45,
  image:
  'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '2',
  name: 'Iced Latte',
  category: 'Drinks',
  price: 4.5,
  stock: 120,
  image:
  'https://images.unsplash.com/photo-1517701550927-30cfcb64c533?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '3',
  name: 'Blueberry Muffin',
  category: 'Snacks',
  price: 3.75,
  stock: 8,
  image:
  'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '4',
  name: 'Grilled Cheese',
  category: 'Food',
  price: 7.0,
  stock: 30,
  image:
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '5',
  name: 'Matcha Tea',
  category: 'Drinks',
  price: 5.0,
  stock: 0,
  image:
  'https://images.unsplash.com/photo-1582787030061-00270a80e181?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '6',
  name: 'Chocolate Cake',
  category: 'Desserts',
  price: 6.5,
  stock: 12,
  image:
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '7',
  name: 'Croissant',
  category: 'Snacks',
  price: 3.5,
  stock: 25,
  image:
  'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '8',
  name: 'Acai Bowl',
  category: 'Food',
  price: 9.0,
  stock: 15,
  image:
  'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '9',
  name: 'Espresso',
  category: 'Drinks',
  price: 3.0,
  stock: 200,
  image:
  'https://images.unsplash.com/photo-1510591509098-f4fdc6d0fd24?auto=format&fit=crop&q=80&w=400&h=400'
},
{
  id: '10',
  name: 'Vegan Cookie',
  category: 'Snacks',
  price: 2.5,
  stock: 4,
  image:
  'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400&h=400'
}];


export const mockTransactions: Transaction[] = [
{
  id: 'ORD-001',
  date: '2023-10-24 14:30',
  items: 3,
  total: 16.75,
  status: 'Completed'
},
{
  id: 'ORD-002',
  date: '2023-10-24 14:15',
  items: 1,
  total: 4.5,
  status: 'Completed'
},
{
  id: 'ORD-003',
  date: '2023-10-24 13:50',
  items: 4,
  total: 28.0,
  status: 'Refunded'
},
{
  id: 'ORD-004',
  date: '2023-10-24 13:20',
  items: 2,
  total: 12.5,
  status: 'Completed'
},
{
  id: 'ORD-005',
  date: '2023-10-24 12:45',
  items: 5,
  total: 34.25,
  status: 'Pending'
},
{
  id: 'ORD-006',
  date: '2023-10-24 12:10',
  items: 1,
  total: 3.0,
  status: 'Completed'
},
{
  id: 'ORD-007',
  date: '2023-10-24 11:30',
  items: 2,
  total: 15.5,
  status: 'Completed'
},
{
  id: 'ORD-008',
  date: '2023-10-24 10:15',
  items: 3,
  total: 21.0,
  status: 'Completed'
}];


export const mockStats: Stat[] = [
{ label: "Today's Sales", value: '$1,245.00', change: 12.5, trend: 'up' },
{ label: 'Total Orders', value: '142', change: 8.2, trend: 'up' },
{ label: 'Revenue (Week)', value: '$8,430.50', change: -2.4, trend: 'down' },
{ label: 'Avg Order Value', value: '$18.50', change: 4.1, trend: 'up' }];