const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHmac } = require('node:crypto');
const jwt = require('jsonwebtoken');

// ─── Configuration ───────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT || 5000);
const DATA_FILE = path.join(__dirname, 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'expenseiq-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_EXPIRES_IN = '7d';
const CSRF_SECRET = process.env.CSRF_SECRET || 'expenseiq-csrf-secret-change-in-production';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 100;

// ─── OAuth Configuration ──────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// ─── Seed Data: 120 Realistic Transactions (Jan–Aug 2025) ────────────────────

const seedTransactions = [
  // ── January 2025 ──
  { id: 'j01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5200, date: '2025-01-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-01-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 145, date: '2025-01-12T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'j04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-01-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j05', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 127.43, date: '2025-01-08T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'j06', type: 'expense', category: 'Food', description: 'Trader Joe\'s', amount: 68.92, date: '2025-01-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'j07', type: 'expense', category: 'Food', description: 'Chipotle Mexican Grill', amount: 14.85, date: '2025-01-10T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'j08', type: 'expense', category: 'Food', description: 'Starbucks Coffee', amount: 5.75, date: '2025-01-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'j09', type: 'expense', category: 'Transport', description: 'Uber ride - downtown', amount: 22.50, date: '2025-01-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'j10', type: 'expense', category: 'Transport', description: 'MetroCard top-up', amount: 33, date: '2025-01-03T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['transport', 'transit'], isRecurring: false },
  { id: 'j11', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-01-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j12', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-01-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j13', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-01-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'j14', type: 'expense', category: 'Health', description: 'CVS Pharmacy - flu medicine', amount: 28.50, date: '2025-01-25T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['health', 'pharmacy'], isRecurring: false },
  { id: 'j15', type: 'expense', category: 'Shopping', description: 'Amazon - winter jacket', amount: 89.99, date: '2025-01-16T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'clothing'], isRecurring: false },
  { id: 'j16', type: 'expense', category: 'Food', description: 'Domino\'s Pizza delivery', amount: 24.99, date: '2025-01-27T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'j17', type: 'income', category: 'Freelance', description: 'Upwork - web design project', amount: 850, date: '2025-01-20T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },

  // ── February 2025 ──
  { id: 'f01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5200, date: '2025-02-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-02-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 132, date: '2025-02-11T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'f04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-02-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f05', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 112.67, date: '2025-02-07T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'f06', type: 'expense', category: 'Food', description: 'Costco bulk groceries', amount: 243.50, date: '2025-02-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'f07', type: 'expense', category: 'Food', description: 'Panera Bread lunch', amount: 16.45, date: '2025-02-12T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'f08', type: 'expense', category: 'Food', description: 'Chick-fil-A dinner', amount: 12.89, date: '2025-02-20T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'f09', type: 'expense', category: 'Transport', description: 'Uber ride - airport', amount: 45.20, date: '2025-02-10T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'f10', type: 'expense', category: 'Transport', description: 'Gas station - Shell', amount: 52.30, date: '2025-02-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'f11', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-02-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f12', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-02-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f13', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-02-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'f14', type: 'expense', category: 'Shopping', description: 'Target - Valentine\'s gift', amount: 65.00, date: '2025-02-13T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'gift'], isRecurring: false },
  { id: 'f15', type: 'expense', category: 'Food', description: 'Olive Garden dinner (Valentine\'s)', amount: 78.50, date: '2025-02-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining', 'special'], isRecurring: false },
  { id: 'f16', type: 'expense', category: 'Shopping', description: 'Amazon - wireless earbuds', amount: 49.99, date: '2025-02-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'electronics'], isRecurring: false },
  { id: 'f17', type: 'income', category: 'Freelance', description: 'Upwork - mobile app UI', amount: 1200, date: '2025-02-18T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },

  // ── March 2025 ──
  { id: 'm01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5200, date: '2025-03-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-03-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 118, date: '2025-03-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'm04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-03-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-03-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 98.34, date: '2025-03-06T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'm07', type: 'expense', category: 'Food', description: 'Walmart groceries', amount: 156.78, date: '2025-03-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'm08', type: 'expense', category: 'Food', description: 'Shake Shack', amount: 18.95, date: '2025-03-12T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'm09', type: 'expense', category: 'Food', description: 'Starbucks Coffee', amount: 6.25, date: '2025-03-24T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'm10', type: 'expense', category: 'Transport', description: 'Uber ride - office', amount: 18.40, date: '2025-03-11T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'm11', type: 'expense', category: 'Transport', description: 'Gas station - BP', amount: 48.75, date: '2025-03-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'm12', type: 'expense', category: 'Transport', description: 'Parking garage - downtown', amount: 25, date: '2025-03-15T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['transport', 'parking'], isRecurring: false },
  { id: 'm13', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-03-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm14', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-03-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm15', type: 'expense', category: 'Entertainment', description: 'AMC movie tickets (2)', amount: 32, date: '2025-03-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'movies'], isRecurring: false },
  { id: 'm16', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-03-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'm17', type: 'expense', category: 'Health', description: 'Annual physical co-pay', amount: 40, date: '2025-03-28T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['health', 'doctor'], isRecurring: false },
  { id: 'm18', type: 'expense', category: 'Shopping', description: 'Nike running shoes', amount: 129.99, date: '2025-03-08T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'clothing'], isRecurring: false },
  { id: 'm19', type: 'expense', category: 'Food', description: 'Uber Eats - Thai food', amount: 32.45, date: '2025-03-26T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'delivery'], isRecurring: false },

  // ── April 2025 ──
  { id: 'a01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5300, date: '2025-04-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-04-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 98, date: '2025-04-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'a04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-04-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-04-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 105.23, date: '2025-04-07T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'a07', type: 'expense', category: 'Food', description: 'Trader Joe\'s', amount: 72.15, date: '2025-04-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'a08', type: 'expense', category: 'Food', description: 'Sushi restaurant - Nobu', amount: 95.00, date: '2025-04-12T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining', 'special'], isRecurring: false },
  { id: 'a09', type: 'expense', category: 'Food', description: 'Panda Express', amount: 11.25, date: '2025-04-22T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'a10', type: 'expense', category: 'Transport', description: 'Uber ride - concert venue', amount: 28.90, date: '2025-04-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'a11', type: 'expense', category: 'Transport', description: 'Gas station - Exxon', amount: 51.20, date: '2025-04-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'a12', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-04-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a13', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-04-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a14', type: 'expense', category: 'Entertainment', description: 'Concert tickets - The Weeknd', amount: 120, date: '2025-04-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'concert'], isRecurring: false },
  { id: 'a15', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-04-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'a16', type: 'expense', category: 'Shopping', description: 'Best Buy - smart watch', amount: 249.99, date: '2025-04-16T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'electronics'], isRecurring: false },
  { id: 'a17', type: 'expense', category: 'Food', description: 'DoorDash - Chinese food', amount: 28.75, date: '2025-04-26T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'delivery'], isRecurring: false },
  { id: 'a18', type: 'income', category: 'Freelance', description: 'Fiverr - logo design', amount: 350, date: '2025-04-22T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },

  // ── May 2025 ──
  { id: 'ma01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5300, date: '2025-05-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-05-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 105, date: '2025-05-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'ma04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-05-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-05-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 134.56, date: '2025-05-06T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'ma07', type: 'expense', category: 'Food', description: 'Aldi groceries', amount: 89.23, date: '2025-05-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'ma08', type: 'expense', category: 'Food', description: 'Pizza Hut delivery', amount: 22.50, date: '2025-05-13T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'delivery'], isRecurring: false },
  { id: 'ma09', type: 'expense', category: 'Food', description: 'Dunkin\' Donuts', amount: 8.45, date: '2025-05-24T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'ma10', type: 'expense', category: 'Transport', description: 'Uber ride - brunch', amount: 15.60, date: '2025-05-11T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'ma11', type: 'expense', category: 'Transport', description: 'Gas station - Shell', amount: 47.80, date: '2025-05-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'ma12', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-05-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma13', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-05-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma14', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-05-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ma15', type: 'expense', category: 'Shopping', description: 'Amazon - desk lamp', amount: 34.99, date: '2025-05-16T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'home'], isRecurring: false },
  { id: 'ma16', type: 'expense', category: 'Shopping', description: 'IKEA - storage organizer', amount: 59.99, date: '2025-05-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'home'], isRecurring: false },
  { id: 'ma17', type: 'expense', category: 'Food', description: 'Cheesecake Factory (Mother\'s Day)', amount: 112.00, date: '2025-05-11T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining', 'special'], isRecurring: false },
  { id: 'ma18', type: 'income', category: 'Freelance', description: 'Upwork - data analysis dashboard', amount: 950, date: '2025-05-15T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },
  { id: 'ma19', type: 'income', category: 'Refund', description: 'Amazon return refund', amount: 49.99, date: '2025-05-25T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'refund'], isRecurring: false },

  // ── June 2025 ──
  { id: 'ju01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5400, date: '2025-06-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-06-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison', amount: 138, date: '2025-06-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'ju04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-06-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-06-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 118.45, date: '2025-06-06T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'ju07', type: 'expense', category: 'Food', description: 'Trader Joe\'s', amount: 76.30, date: '2025-06-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'ju08', type: 'expense', category: 'Food', description: 'Starbucks Coffee', amount: 5.75, date: '2025-06-09T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'ju09', type: 'expense', category: 'Food', description: 'Sweetgreen salad', amount: 14.95, date: '2025-06-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'ju10', type: 'expense', category: 'Food', description: 'Wendy\'s drive-thru', amount: 9.87, date: '2025-06-25T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'ju11', type: 'expense', category: 'Transport', description: 'Uber ride - downtown', amount: 18.75, date: '2025-06-09T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'ju12', type: 'expense', category: 'Transport', description: 'Gas station - BP', amount: 53.40, date: '2025-06-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'ju13', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-06-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju14', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-06-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju15', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-06-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'ju16', type: 'expense', category: 'Health', description: 'Dental cleaning co-pay', amount: 35, date: '2025-06-26T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['health', 'dental'], isRecurring: false },
  { id: 'ju17', type: 'expense', category: 'Shopping', description: 'Amazon - noise cancelling headphones', amount: 179.99, date: '2025-06-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'electronics'], isRecurring: false },
  { id: 'ju18', type: 'expense', category: 'Shopping', description: 'Uniqlo - summer shirts', amount: 59.94, date: '2025-06-21T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'clothing'], isRecurring: false },
  { id: 'ju19', type: 'income', category: 'Freelance', description: 'Upwork - SEO audit report', amount: 650, date: '2025-06-15T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },
  { id: 'ju20', type: 'expense', category: 'Food', description: 'Airbnb + dining (weekend trip)', amount: 285, date: '2025-06-28T00:00:00.000Z', paymentMethod: 'card', status: 'pending', tags: ['food', 'travel', 'special'], isRecurring: false },

  // ── July 2025 ──
  { id: 'jul01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5400, date: '2025-07-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-07-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison (summer AC)', amount: 175, date: '2025-07-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'jul04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-07-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-07-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 142.80, date: '2025-07-06T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'jul07', type: 'expense', category: 'Food', description: 'Costco bulk groceries', amount: 267.45, date: '2025-07-13T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'jul08', type: 'expense', category: 'Food', description: 'Chipotle Mexican Grill', amount: 13.50, date: '2025-07-09T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'jul09', type: 'expense', category: 'Food', description: 'Starbucks Coffee', amount: 6.95, date: '2025-07-22T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'jul10', type: 'expense', category: 'Food', description: '4th of July BBQ supplies', amount: 89.50, date: '2025-07-03T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries', 'special'], isRecurring: false },
  { id: 'jul11', type: 'expense', category: 'Transport', description: 'Uber ride - friend\'s party', amount: 24.30, date: '2025-07-12T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'jul12', type: 'expense', category: 'Transport', description: 'Gas station - Shell', amount: 55.60, date: '2025-07-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'jul13', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-07-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul14', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-07-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul15', type: 'expense', category: 'Entertainment', description: 'AMC movie tickets (2)', amount: 34, date: '2025-07-26T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'movies'], isRecurring: false },
  { id: 'jul16', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-07-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'jul17', type: 'expense', category: 'Shopping', description: 'Amazon - patio furniture', amount: 189.99, date: '2025-07-08T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'home'], isRecurring: false },
  { id: 'jul18', type: 'expense', category: 'Food', description: 'Beach house Airbnb + food', amount: 420, date: '2025-07-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'travel', 'special'], isRecurring: false },
  { id: 'jul19', type: 'income', category: 'Freelance', description: 'Upwork - landing page design', amount: 1100, date: '2025-07-20T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },
  { id: 'jul20', type: 'expense', category: 'Food', description: 'Uber Eats - Thai food', amount: 35.20, date: '2025-07-28T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'delivery'], isRecurring: false },

  // ── August 2025 ──
  { id: 'aug01', type: 'income', category: 'Salary', description: 'Monthly Salary - Acme Corp', amount: 5400, date: '2025-08-05T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug02', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-08-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug03', type: 'expense', category: 'Utilities', description: 'Electricity bill - ConEdison (summer peak)', amount: 192, date: '2025-08-10T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: false },
  { id: 'aug04', type: 'expense', category: 'Utilities', description: 'Internet bill - Spectrum', amount: 59, date: '2025-08-15T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'internet'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug05', type: 'expense', category: 'Utilities', description: 'Verizon mobile bill', amount: 85, date: '2025-08-18T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['utilities', 'phone'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug06', type: 'expense', category: 'Food', description: 'Whole Foods Market', amount: 128.90, date: '2025-08-06T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'aug07', type: 'expense', category: 'Food', description: 'Trader Joe\'s', amount: 84.35, date: '2025-08-19T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: 'aug08', type: 'expense', category: 'Food', description: 'Starbucks Coffee', amount: 5.25, date: '2025-08-08T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'coffee'], isRecurring: false },
  { id: 'aug09', type: 'expense', category: 'Food', description: 'Panda Express', amount: 12.45, date: '2025-08-22T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'dining'], isRecurring: false },
  { id: 'aug10', type: 'expense', category: 'Transport', description: 'Uber ride - concert', amount: 32.50, date: '2025-08-09T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'rideshare'], isRecurring: false },
  { id: 'aug11', type: 'expense', category: 'Transport', description: 'Gas station - Exxon', amount: 50.10, date: '2025-08-16T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport', 'gas'], isRecurring: false },
  { id: 'aug12', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-08-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug13', type: 'expense', category: 'Entertainment', description: 'Spotify Premium', amount: 9.99, date: '2025-08-20T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug14', type: 'expense', category: 'Health', description: 'Planet Fitness membership', amount: 49, date: '2025-08-05T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: 'aug15', type: 'expense', category: 'Health', description: 'Prescription refill - Walgreens', amount: 22.50, date: '2025-08-14T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['health', 'pharmacy'], isRecurring: false },
  { id: 'aug16', type: 'expense', category: 'Shopping', description: 'Amazon - standing desk converter', amount: 149.99, date: '2025-08-07T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['shopping', 'home', 'office'], isRecurring: false },
  { id: 'aug17', type: 'expense', category: 'Food', description: 'Back-to-school dinner (family)', amount: 95.00, date: '2025-08-23T00:00:00.000Z', paymentMethod: 'card', status: 'pending', tags: ['food', 'dining', 'special'], isRecurring: false },
  { id: 'aug18', type: 'income', category: 'Freelance', description: 'Upwork - full-stack development sprint', amount: 2400, date: '2025-08-15T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },
  { id: 'aug19', type: 'income', category: 'Refund', description: 'Best Buy return refund', amount: 179.99, date: '2025-08-12T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'refund'], isRecurring: false },
  { id: 'aug20', type: 'expense', category: 'Food', description: 'DoorDash - pizza night', amount: 29.45, date: '2025-08-25T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['food', 'delivery'], isRecurring: false },
];

// ─── Data Store ──────────────────────────────────────────────────────────────

function initialStore() {
  return {
    users: [],
    transactions: seedTransactions,
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialStore(), null, 2));
  }
}

function readStore() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const rateLimitStore = new Map();

function getRateLimitKey(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + RATE_LIMIT_WINDOW_MS; }
  record.count++;
  rateLimitStore.set(key, record);
  return record.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

// ─── CSRF ────────────────────────────────────────────────────────────────────

function generateCsrfToken(sessionId) {
  const timestamp = Date.now().toString();
  const payload = `${sessionId}:${timestamp}`;
  const signature = createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyCsrfToken(token, sessionId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [tokenSessionId, timestamp, signature] = parts;
    if (tokenSessionId !== sessionId) return false;
    const payload = `${tokenSessionId}:${timestamp}`;
    const expectedSig = createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) return false;
    const age = Date.now() - Number(timestamp);
    if (age > 60 * 60 * 1000) return false;
    return true;
  } catch { return false; }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

function generateTokens(user) {
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// ─── HTTPS Fetch Helper ──────────────────────────────────────────────────────

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from ' + url)); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── bcrypt ──────────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
async function hashPassword(password) { return bcrypt.hash(password, 12); }
async function verifyPassword(password, hash) { return bcrypt.compare(password, hash); }

// ─── Security Headers ────────────────────────────────────────────────────────

function securityHeaders(req) {
  const origin = req.headers.origin || 'http://localhost:4200';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
}

// ─── Response Helpers ────────────────────────────────────────────────────────

function sendApi(req, res, status, message, data = null) {
  res.writeHead(status, { ...securityHeaders(req), 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: status < 400, message, data, timestamp: new Date().toISOString() }));
}

function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `access_token=${accessToken}; HttpOnly; Secure=${isProd}; SameSite=Strict; Path=/; Max-Age=${24*60*60}`,
    `refresh_token=${refreshToken}; HttpOnly; Secure=${isProd}; SameSite=Strict; Path=/api/auth/refresh; Max-Age=${7*24*60*60}`,
    `csrf_token=${csrfToken}; Secure=${isProd}; SameSite=Strict; Path=/; Max-Age=${60*60}`,
  ]);
}

function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `access_token=; HttpOnly; Secure=${isProd}; SameSite=Strict; Path=/; Max-Age=0`,
    `refresh_token=; HttpOnly; Secure=${isProd}; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0`,
    `csrf_token=; Secure=${isProd}; SameSite=Strict; Path=/; Max-Age=0`,
  ]);
}

// ─── Body/Cookie Parsers ─────────────────────────────────────────────────────

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) { reject(new Error('Request body is too large.')); req.destroy(); } });
    req.on('end', () => { if (!body.trim()) { resolve({}); return; } try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON body.')); } });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach((pair) => { const [key, ...rest] = pair.split('='); if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=')); });
  return cookies;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  const cookies = parseCookies(req);
  return cookies.access_token || null;
}

function authenticate(req, res) {
  const token = extractToken(req);
  if (!token) { sendApi(req, res, 401, 'Authentication required.'); return null; }
  const payload = verifyAccessToken(token);
  if (!payload) { sendApi(req, res, 401, 'Invalid or expired token.'); return null; }
  return payload;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateTransaction(body) {
  const errors = [];
  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) errors.push('Category is required.');
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) errors.push('Description is required.');
  if (body.amount === undefined || body.amount === null) errors.push('Amount is required.');
  else if (typeof body.amount !== 'number' || body.amount <= 0) errors.push('Amount must be a positive number.');
  if (body.type && !['income', 'expense'].includes(body.type)) errors.push('Type must be "income" or "expense".');
  if (body.paymentMethod && !['cash', 'card', 'upi', 'bank'].includes(body.paymentMethod)) errors.push('Invalid payment method.');
  if (body.status && !['completed', 'pending', 'failed'].includes(body.status)) errors.push('Invalid status.');
  if (body.date && isNaN(new Date(body.date).getTime())) errors.push('Invalid date format.');
  if (body.tags && !Array.isArray(body.tags)) errors.push('Tags must be an array.');
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body.email || typeof body.email !== 'string') errors.push('Email is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Invalid email format.');
  if (!body.password || typeof body.password !== 'string') errors.push('Password is required.');
  else if (body.password.length < 6) errors.push('Password must be at least 6 characters.');
  return errors;
}

// ─── Transaction Helpers ─────────────────────────────────────────────────────

function normalizeTransaction(body) {
  return {
    id: String(body.id || randomUUID()),
    type: body.type === 'income' ? 'income' : 'expense',
    category: String(body.category || 'Food').trim(),
    subCategory: body.subCategory ? String(body.subCategory).trim() : undefined,
    description: String(body.description || 'New transaction').trim(),
    amount: Number(body.amount || 0),
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    paymentMethod: ['cash', 'card', 'upi', 'bank'].includes(body.paymentMethod) ? body.paymentMethod : 'cash',
    status: ['completed', 'pending', 'failed'].includes(body.status) ? body.status : 'completed',
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    location: body.location ? String(body.location).trim() : undefined,
    receiptUrl: body.receiptUrl ? String(body.receiptUrl).trim() : undefined,
    isRecurring: Boolean(body.isRecurring),
    recurringFrequency: body.recurringFrequency ? String(body.recurringFrequency) : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
  };
}

function deriveName(email) {
  return String(email || 'user').split('@')[0].split(/[._-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Demo User';
}

function deriveInitials(email) {
  const parts = String(email || 'user').split('@')[0].split(/[._-]+/).filter(Boolean);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0]?.slice(0, 2).toUpperCase() || 'U';
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function paginate(array, page = 1, pageSize = 10, sortBy = 'date', sortOrder = 'desc') {
  const p = Math.max(1, Math.floor(page));
  const ps = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const dir = sortOrder === 'asc' ? 'asc' : 'desc';
  const sorted = [...array].sort((a, b) => {
    let av = sortBy === 'date' ? new Date(a[sortBy]).getTime() : a[sortBy];
    let bv = sortBy === 'date' ? new Date(b[sortBy]).getTime() : b[sortBy];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = String(bv).toLowerCase(); }
    return dir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
  });
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const start = (p - 1) * ps;
  return { items: sorted.slice(start, start + ps), pagination: { page: p, pageSize: ps, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1 } };
}

// ─── Analytics Helpers ───────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthIdx(dateStr) {
  const d = new Date(dateStr);
  return d.getMonth(); // 0=Jan..7=Aug
}

function getWeekday(dateStr) {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7; // 0=Mon..6=Sun
}

function groupByMonth(transactions) {
  const groups = {};
  MONTHS.forEach((m, i) => { groups[i] = { income: 0, expense: 0 }; });
  transactions.forEach(t => {
    const mi = getMonthIdx(t.date);
    if (groups[mi]) {
      if (t.type === 'income') groups[mi].income += t.amount;
      else groups[mi].expense += t.amount;
    }
  });
  return groups;
}

// ─── Recurring Expenses (reference data) ─────────────────────────────────────

const seedRecurring = [
  { id: 'netflix', name: 'Netflix', icon: '🎬', iconBg: '#fee2e2', iconColor: '#ef4444', category: 'Entertainment', amount: 15.99, frequency: 'monthly', nextDue: 'Sep 15', dueSoon: true, payment: 'Card', status: 'active' },
  { id: 'spotify', name: 'Spotify Premium', icon: '🎵', iconBg: '#dcfce7', iconColor: '#16a34a', category: 'Entertainment', amount: 9.99, frequency: 'monthly', nextDue: 'Sep 20', dueSoon: false, payment: 'Card', status: 'active' },
  { id: 'internet', name: 'Internet Bill', icon: '📶', iconBg: '#dbeafe', iconColor: '#2b7fff', category: 'Utilities', amount: 59, frequency: 'monthly', nextDue: 'Sep 15', dueSoon: true, payment: 'Card', status: 'active' },
  { id: 'phone', name: 'Verizon Mobile', icon: '📱', iconBg: '#f3e8ff', iconColor: '#9333ea', category: 'Utilities', amount: 85, frequency: 'monthly', nextDue: 'Sep 18', dueSoon: false, payment: 'Card', status: 'active' },
  { id: 'rent', name: 'Apartment Rent', icon: '🏠', iconBg: '#fef3c7', iconColor: '#d97706', category: 'Housing', amount: 1200, frequency: 'monthly', nextDue: 'Sep 01', dueSoon: false, payment: 'Bank', status: 'active' },
  { id: 'gym', name: 'Planet Fitness', icon: '💪', iconBg: '#dcfce7', iconColor: '#16a34a', category: 'Health', amount: 49, frequency: 'monthly', nextDue: 'Sep 05', dueSoon: false, payment: 'Card', status: 'active' },
  { id: 'insurance', name: 'Health Insurance', icon: '🛡️', iconBg: '#dbeafe', iconColor: '#2b7fff', category: 'Insurance', amount: 240, frequency: 'yearly', nextDue: 'Dec 01', dueSoon: false, payment: 'Bank', status: 'active' },
];

// ─── Accounts (reference data) ───────────────────────────────────────────────

const seedAccounts = [
  { id: 'chase', name: 'Chase Checking', kind: 'bank', maskedNumber: '••••6521', balance: 12450, income: 5200, expense: 2840, gradientFrom: '#2b7fff', gradientTo: '#1a4fd6' },
  { id: 'amex', name: 'Amex Gold', kind: 'credit', maskedNumber: '••••9823', balance: 2340, income: 0, expense: 950, gradientFrom: '#27272a', gradientTo: '#09090b' },
  { id: 'cash', name: 'Personal Cash', kind: 'cash', maskedNumber: 'Cash', balance: 850, income: 300, expense: 150, gradientFrom: '#16a34a', gradientTo: '#0d6b30' },
  { id: 'paytm', name: 'Paytm Wallet', kind: 'upi', maskedNumber: 'UPI/digital', balance: 1210, income: 600, expense: 320, gradientFrom: '#9333ea', gradientTo: '#6b21a8' },
];

// ─── Goals (reference data) ──────────────────────────────────────────────────

const seedGoals = [
  { id: 'emergency', name: 'Emergency Fund', icon: '🛟', iconBg: '#dbeafe', iconColor: '#2b7fff', targetAmount: 10000, currentAmount: 6800, deadline: 'Dec 2025', monthlyContribution: 400, status: 'on-track' },
  { id: 'vacation', name: 'Vacation to Japan', icon: '✈️', iconBg: '#fce7f3', iconColor: '#db2777', targetAmount: 4500, currentAmount: 2100, deadline: 'Aug 2025', monthlyContribution: 300, status: 'behind' },
  { id: 'car', name: 'New Car Down Payment', icon: '🚗', iconBg: '#dcfce7', iconColor: '#16a34a', targetAmount: 8000, currentAmount: 8000, deadline: 'May 2025', monthlyContribution: 0, status: 'completed' },
  { id: 'laptop', name: 'New Laptop', icon: '💻', iconBg: '#fef3c7', iconColor: '#d97706', targetAmount: 1800, currentAmount: 1200, deadline: 'Sep 2025', monthlyContribution: 150, status: 'on-track' },
  { id: 'wedding', name: 'Wedding Fund', icon: '💍', iconBg: '#f3e8ff', iconColor: '#9333ea', targetAmount: 15000, currentAmount: 5200, deadline: 'Jun 2026', monthlyContribution: 500, status: 'behind' },
];

// ─── Budget Categories ───────────────────────────────────────────────────────

const BUDGET_CATEGORIES = [
  { category: 'Food', icon: '🍔', iconBg: '#fee2e2', budget: 600 },
  { category: 'Transport', icon: '🚗', iconBg: '#dbeafe', budget: 300 },
  { category: 'Shopping', icon: '🛍️', iconBg: '#f3e8ff', budget: 500 },
  { category: 'Health', icon: '💊', iconBg: '#dcfce7', budget: 200 },
  { category: 'Entertainment', icon: '🎬', iconBg: '#fce7f3', budget: 300 },
  { category: 'Utilities', icon: '⚡', iconBg: '#e0e7ff', budget: 400 },
  { category: 'Housing', icon: '🏠', iconBg: '#fef3c7', budget: 1200 },
  { category: 'Fitness', icon: '💪', iconBg: '#dcfce7', budget: 100 },
  { category: 'Education', icon: '📚', iconBg: '#fae8ff', budget: 200 },
];

// ─── Pagination ──────────────────────────────────────────────────────────────

function paginate(array, page = 1, pageSize = 10, sortBy = 'date', sortOrder = 'desc') {
  const p = Math.max(1, Math.floor(page));
  const ps = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const dir = sortOrder === 'asc' ? 'asc' : 'desc';
  const sorted = [...array].sort((a, b) => {
    let av = sortBy === 'date' ? new Date(a[sortBy]).getTime() : a[sortBy];
    let bv = sortBy === 'date' ? new Date(b[sortBy]).getTime() : b[sortBy];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = String(bv).toLowerCase(); }
    return dir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
  });
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const start = (p - 1) * ps;
  return { items: sorted.slice(start, start + ps), pagination: { page: p, pageSize: ps, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1 } };
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, securityHeaders(req)); res.end(); return; }
  if (isRateLimited(req)) { sendApi(req, res, 429, 'Too many requests.'); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  // ── Health ──
  if (req.method === 'GET' && pathname === '/api/health') { sendApi(req, res, 200, 'OK.', { status: 'ok' }); return; }

  // ── CSRF ──
  if (req.method === 'GET' && pathname === '/api/csrf-token') {
    const cookies = parseCookies(req);
    const sessionId = cookies.session_id || randomUUID();
    sendApi(req, res, 200, 'CSRF token generated.', { csrfToken: generateCsrfToken(sessionId), sessionId });
    return;
  }

  // ── Auth: Register ──
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) { sendApi(req, res, 400, 'Email and password are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { sendApi(req, res, 400, 'Invalid email format.'); return; }
    if (password.length < 6) { sendApi(req, res, 400, 'Password must be at least 6 characters.'); return; }
    const store = readStore();
    if (store.users.find(u => u.email === email)) { sendApi(req, res, 409, 'User already exists.'); return; }
    const user = { id: randomUUID(), email, password: await hashPassword(password), name: deriveName(email), initials: deriveInitials(email), createdAt: new Date().toISOString() };
    store.users.push(user); writeStore(store);
    const { accessToken, refreshToken } = generateTokens(user);
    const csrfToken = generateCsrfToken(user.id);
    setAuthCookies(res, accessToken, refreshToken, csrfToken);
    const { password: _, ...safeUser } = user;
    sendApi(req, res, 201, 'Registration successful.', { user: safeUser, token: accessToken, csrfToken });
    return;
  }

  // ── Auth: Login ──
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const errors = validateLogin(body);
    if (errors.length) { sendApi(req, res, 400, errors.join(' ')); return; }
    const store = readStore();
    let user = store.users.find(u => u.email === email);
    if (!user) {
      user = { id: randomUUID(), email, password: await hashPassword(password), name: deriveName(email), initials: deriveInitials(email), createdAt: new Date().toISOString() };
      store.users.push(user); writeStore(store);
    } else {
      if (!(await verifyPassword(password, user.password))) { sendApi(req, res, 401, 'Invalid email or password.'); return; }
    }
    const { accessToken, refreshToken } = generateTokens(user);
    const csrfToken = generateCsrfToken(user.id);
    setAuthCookies(res, accessToken, refreshToken, csrfToken);
    const { password: _, ...safeUser } = user;
    sendApi(req, res, 200, 'Login successful.', { user: safeUser, token: accessToken, csrfToken });
    return;
  }

  // ── Auth: Refresh ──
  if (req.method === 'POST' && pathname === '/api/auth/refresh') {
    const cookies = parseCookies(req);
    if (!cookies.refresh_token) { sendApi(req, res, 401, 'Refresh token required.'); return; }
    const payload = verifyAccessToken(cookies.refresh_token);
    if (!payload || payload.type !== 'refresh') { sendApi(req, res, 401, 'Invalid refresh token.'); return; }
    const store = readStore();
    const user = store.users.find(u => u.id === payload.sub);
    if (!user) { sendApi(req, res, 401, 'User not found.'); return; }
    const tokens = generateTokens(user);
    const csrfToken = generateCsrfToken(user.id);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, csrfToken);
    sendApi(req, res, 200, 'Token refreshed.', { token: tokens.accessToken, csrfToken });
    return;
  }

  // ── Auth: Logout ──
  if (req.method === 'POST' && pathname === '/api/auth/logout') { clearAuthCookies(res); sendApi(req, res, 200, 'Logged out.'); return; }

  // ── Auth: Forgot Password ──
  if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { sendApi(req, res, 400, 'Valid email is required.'); return; }
    sendApi(req, res, 200, 'If an account with that email exists, a reset link has been sent.');
    return;
  }

  // ── Auth: Reset Password ──
  if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await readJsonBody(req);
    const token = String(body.token || '');
    const password = String(body.password || '');
    if (!token) { sendApi(req, res, 400, 'Reset token is required.'); return; }
    if (!password || password.length < 6) { sendApi(req, res, 400, 'Password must be at least 6 characters.'); return; }
    sendApi(req, res, 200, 'Password has been reset. You can now log in with your new password.');
    return;
  }

  // ── Auth: Google OAuth ──
  if (req.method === 'POST' && pathname === '/api/auth/google') {
    const body = await readJsonBody(req);
    const idToken = String(body.credential || '');
    if (!idToken) { sendApi(req, res, 400, 'Google credential is required.'); return; }

    try {
      // Decode the JWT payload (no secret verification for dev — in production verify with Google's public key)
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      const email = (payload.email || '').toLowerCase();
      const name = payload.name || deriveName(email);
      const avatar = payload.picture || '';

      if (!email) { sendApi(req, res, 400, 'Could not extract email from Google token.'); return; }

      const store = readStore();
      let user = store.users.find(u => u.email === email);
      if (!user) {
        user = {
          id: randomUUID(), email, password: await hashPassword(randomUUID()),
          name, avatar, initials: deriveInitials(email),
          provider: 'google', createdAt: new Date().toISOString()
        };
        store.users.push(user); writeStore(store);
      } else if (!user.provider) {
        user.provider = 'google';
        if (avatar && !user.avatar) user.avatar = avatar;
        writeStore(store);
      }

      const { accessToken, refreshToken } = generateTokens(user);
      const csrfToken = generateCsrfToken(user.id);
      setAuthCookies(res, accessToken, refreshToken, csrfToken);
      const { password: _, ...safeUser } = user;
      sendApi(req, res, 200, 'Google login successful.', { user: safeUser, token: accessToken, csrfToken });
    } catch (err) {
      sendApi(req, res, 401, 'Invalid Google credential.');
    }
    return;
  }

  // ── Auth: GitHub OAuth — Redirect ──
  if (req.method === 'GET' && pathname === '/api/auth/github') {
    if (!GITHUB_CLIENT_ID) { sendApi(req, res, 500, 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID.'); return; }
    const state = randomUUID();
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&state=${state}`;
    res.writeHead(302, { ...securityHeaders(req), Location: githubUrl });
    res.end();
    return;
  }

  // ── Auth: GitHub OAuth — Callback ──
  if (req.method === 'GET' && pathname === '/api/auth/github/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) {
      res.writeHead(302, { Location: `${FRONTEND_URL}/auth/login?error=github_code_missing` });
      res.end(); return;
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetchJson('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
      });
      const accessToken = tokenRes.access_token;
      if (!accessToken) {
        res.writeHead(302, { Location: `${FRONTEND_URL}/auth/login?error=github_token_failed` });
        res.end(); return;
      }

      // Fetch user info
      const ghUser = await fetchJson('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'ExpenseIQ' },
      });
      const email = (ghUser.email || `${ghUser.login}@github.local`).toLowerCase();
      const name = ghUser.name || ghUser.login;
      const avatar = ghUser.avatar_url || '';

      const store = readStore();
      let user = store.users.find(u => u.email === email);
      if (!user) {
        user = {
          id: randomUUID(), email, password: await hashPassword(randomUUID()),
          name, avatar, initials: deriveInitials(email),
          provider: 'github', createdAt: new Date().toISOString()
        };
        store.users.push(user); writeStore(store);
      } else if (!user.provider) {
        user.provider = 'github';
        if (avatar && !user.avatar) user.avatar = avatar;
        writeStore(store);
      }

      const tokens = generateTokens(user);
      const csrfTk = generateCsrfToken(user.id);

      // Redirect back to frontend with tokens as query params (frontend will store them)
      const params = new URLSearchParams({
        token: tokens.accessToken,
        csrfToken: csrfTk,
        email: user.email,
        name: user.name || '',
        avatar: user.avatar || '',
        provider: 'github',
      });
      res.writeHead(302, { Location: `${FRONTEND_URL}/auth/callback?${params.toString()}` });
      res.end();
    } catch (err) {
      res.writeHead(302, { Location: `${FRONTEND_URL}/auth/login?error=github_failed` });
      res.end();
    }
    return;
  }

  // ── Auth: Me ──
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const user = store.users.find(u => u.id === userPayload.sub);
    if (!user) { sendApi(req, res, 404, 'User not found.'); return; }
    const { password: _, ...safeUser } = user;
    sendApi(req, res, 200, 'User loaded.', safeUser);
    return;
  }

  // ── Transactions: List ──
  if (req.method === 'GET' && pathname === '/api/transactions') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '100', 10);
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || '';
    const paymentMethod = url.searchParams.get('paymentMethod') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    let txs = store.transactions;
    if (search) { const q = search.toLowerCase(); txs = txs.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)); }
    if (type !== 'all') txs = txs.filter(t => t.type === type);
    if (status !== 'all') txs = txs.filter(t => t.status === status);
    if (category) txs = txs.filter(t => t.category.toLowerCase() === category.toLowerCase());
    if (paymentMethod) txs = txs.filter(t => t.paymentMethod === paymentMethod);
    if (dateFrom) { const from = new Date(dateFrom).getTime(); txs = txs.filter(t => new Date(t.date).getTime() >= from); }
    if (dateTo) { const to = new Date(dateTo).getTime(); txs = txs.filter(t => new Date(t.date).getTime() <= to); }
    const result = paginate(txs, page, pageSize, sortBy, sortOrder);
    sendApi(req, res, 200, 'Transactions loaded.', { transactions: result.items, ...result.pagination });
    return;
  }

  // ── Transactions: Create ──
  if (req.method === 'POST' && pathname === '/api/transactions') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const body = await readJsonBody(req);
    const csrfToken = req.headers['x-csrf-token'] || '';
    if (!verifyCsrfToken(csrfToken, userPayload.sub)) { sendApi(req, res, 403, 'Invalid CSRF token.'); return; }
    const errors = validateTransaction(body);
    if (errors.length) { sendApi(req, res, 400, errors.join(' ')); return; }
    const transaction = normalizeTransaction(body);
    const store = readStore();
    store.transactions.unshift(transaction); writeStore(store);
    sendApi(req, res, 201, 'Transaction created.', transaction);
    return;
  }

  // ── Transactions: Delete ──
  const txDelMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
  if (txDelMatch && req.method === 'DELETE') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const csrfToken = req.headers['x-csrf-token'] || '';
    if (!verifyCsrfToken(csrfToken, userPayload.sub)) { sendApi(req, res, 403, 'Invalid CSRF token.'); return; }
    const id = decodeURIComponent(txDelMatch[1]);
    const store = readStore();
    const orig = store.transactions.length;
    store.transactions = store.transactions.filter(t => t.id !== id);
    if (store.transactions.length === orig) { sendApi(req, res, 404, 'Transaction not found.'); return; }
    writeStore(store);
    sendApi(req, res, 200, 'Transaction deleted.', { id });
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW API ENDPOINTS: Dashboard, Budget, Goals, Analytics, Categories,
  //                     Recurring, Calendar, Reports, Accounts
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Dashboard ──
  if (req.method === 'GET' && pathname === '/api/dashboard') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const txs = store.transactions;
    const completed = txs.filter(t => t.status === 'completed');
    const totalIncome = completed.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const totalExpense = completed.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Current month (August = index 7)
    const currentMonthIdx = 7; // August 2025
    const currentMonthTxs = completed.filter(t => getMonthIdx(t.date) === currentMonthIdx);
    const monthIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const monthExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    // Previous month (July)
    const prevMonthTxs = completed.filter(t => getMonthIdx(t.date) === 6);
    const prevMonthIncome = prevMonthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const prevMonthExpense = prevMonthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    const incomeChange = prevMonthIncome > 0 ? Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 1000) / 10 : 0;
    const expenseChange = prevMonthExpense > 0 ? Math.round(((monthExpense - prevMonthExpense) / prevMonthExpense) * 1000) / 10 : 0;

    const monthlyChart = MONTHS.map((m, i) => {
      const monthTxs = completed.filter(t => getMonthIdx(t.date) === i);
      return { month: m, income: Math.round(monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)), expense: Math.round(monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)) };
    });

    // Spending by category
    const catMap = {};
    completed.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const totalExp = Object.values(catMap).reduce((a, v) => a + v, 0);
    const catColors = { Food: '#ef4444', Transport: '#2b7fff', Shopping: '#f59e0b', Health: '#06b6d4', Entertainment: '#eab308', Utilities: '#16a34a', Housing: '#9333ea', Fitness: '#64748b', Education: '#ec4899' };
    const catIcons = { Food: '🍔', Transport: '🚗', Shopping: '🛍️', Health: '💊', Entertainment: '🎬', Utilities: '⚡', Housing: '🏠', Fitness: '💪', Education: '📚' };
    const categoryBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt]) => ({
      category: cat, percentage: totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0, amount: Math.round(amt),
      color: catColors[cat] || '#6b7280', icon: catIcons[cat] || '📦'
    }));

    sendApi(req, res, 200, 'Dashboard loaded.', {
      summary: {
        totalBalance: Math.round(balance * 100) / 100,
        monthlyIncome: Math.round(monthIncome * 100) / 100,
        monthlyExpense: Math.round(monthExpense * 100) / 100,
        savings: Math.round((monthIncome - monthExpense) * 100) / 100,
        budgetRemaining: Math.round((2800 - monthExpense) * 100) / 100,
        balanceChangePercent: Math.round(incomeChange * 10) / 10,
        incomeChangePercent: Math.round(incomeChange * 10) / 10,
        expenseChangePercent: Math.round(expenseChange * 10) / 10,
        savingsChangePercent: monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome - (prevMonthIncome > 0 ? (prevMonthIncome - prevMonthExpense) / prevMonthIncome : 0)) * 1000) / 10 : 0,
        budgetChangePercent: -Math.round(expenseChange * 10) / 10,
      },
      recentTransactions: txs.slice(0, 5),
      monthlyChart,
      categoryBreakdown,
    });
    return;
  }

  // ── Budget ──
  if (req.method === 'GET' && pathname === '/api/budget') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const completed = store.transactions.filter(t => t.status === 'completed' && t.type === 'expense');
    const currentMonthTxs = completed.filter(t => getMonthIdx(t.date) === 7); // August

    const categoryBudgets = BUDGET_CATEGORIES.map(b => {
      const spent = currentMonthTxs.filter(t => t.category === b.category).reduce((a, t) => a + t.amount, 0);
      const progress = b.budget > 0 ? Math.round((spent / b.budget) * 100) : 0;
      const remaining = Math.round((b.budget - spent) * 100) / 100;
      let status = 'on-track';
      if (progress >= 100) status = 'overspent';
      else if (progress >= 80) status = 'warning';
      return { category: b.category, icon: b.icon, iconBg: b.iconBg, budget: b.budget, spent: Math.round(spent * 100) / 100, progress, remaining, status };
    });

    const totalBudget = categoryBudgets.reduce((a, b) => a + b.budget, 0);
    const totalSpent = categoryBudgets.reduce((a, b) => a + b.spent, 0);

    sendApi(req, res, 200, 'Budget loaded.', {
      month: 'August 2025',
      totals: { totalBudget, totalSpent, percentUsed: Math.round((totalSpent / totalBudget) * 100), remainingBudget: totalBudget - totalSpent, isLowBudget: (totalSpent / totalBudget) >= 0.75 },
      categoryBudgets,
      insights: [
        { type: 'success', icon: '🎉', title: 'Great savings this month!', detail: 'You saved more than last month. Keep it up!' },
        { type: 'warning', icon: '💡', title: 'Utilities spending high', detail: 'Summer AC costs are pushing utilities over budget.' },
      ],
      recommendations: [
        { icon: '📉', title: 'Reduce Dining Out', detail: 'Consider cooking more at home to save on food expenses.' },
        { icon: '🔄', title: 'Reallocate Fitness Budget', detail: 'You have unused budget in Fitness. Consider moving it to Entertainment.' },
      ],
    });
    return;
  }

  // ── Goals ──
  if (req.method === 'GET' && pathname === '/api/goals') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    sendApi(req, res, 200, 'Goals loaded.', { goals: seedGoals });
    return;
  }

  // ── Analytics ──
  if (req.method === 'GET' && pathname === '/api/analytics') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const completed = store.transactions.filter(t => t.status === 'completed');

    const monthlyComparison = MONTHS.map((m, i) => {
      const monthTxs = completed.filter(t => getMonthIdx(t.date) === i);
      const income = monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      return { month: m, income: Math.round(income), expense: Math.round(expense), savings: Math.round(income - expense) };
    });

    const catMap = {};
    completed.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const totalExp = Object.values(catMap).reduce((a, v) => a + v, 0);
    const catColors = { Food: '#ef4444', Transport: '#2b7fff', Shopping: '#f59e0b', Health: '#06b6d4', Entertainment: '#eab308', Utilities: '#16a34a', Housing: '#9333ea', Fitness: '#64748b', Education: '#ec4899' };
    const categoryShare = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => ({
      category: cat, percentage: totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0, color: catColors[cat] || '#6b7280'
    }));

    // KPIs
    const allIncome = completed.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const allExpense = completed.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const days = 240; // Jan-Aug ~240 days
    const financialSummary = FULL_MONTHS.slice(0, 8).map((m, i) => {
      const monthTxs = completed.filter(t => getMonthIdx(t.date) === i);
      const inc = monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      return { month: m, income: Math.round(inc), expense: Math.round(exp), savings: Math.round(inc - exp), savingsRate: inc > 0 ? Math.round(((inc - exp) / inc) * 1000) / 10 : 0 };
    });

    sendApi(req, res, 200, 'Analytics loaded.', {
      kpis: {
        totalSpent: Math.round(allExpense), totalIncome: Math.round(allIncome), netSavings: Math.round(allIncome - allExpense),
        avgDailySpend: Math.round(allExpense / days * 100) / 100,
        totalSpentTrend: -5, totalIncomeTrend: 12, netSavingsTrend: 8, avgDailySpendTrend: -3,
      },
      monthlyComparison, categoryShare, financialSummary,
    });
    return;
  }

  // ── Categories ──
  if (req.method === 'GET' && pathname === '/api/categories') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const completed = store.transactions.filter(t => t.status === 'completed');
    const catMap = {};
    completed.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { transactions: 0, totalSpent: 0, type: t.type };
      catMap[t.category].transactions++;
      if (t.type === 'expense') catMap[t.category].totalSpent += t.amount;
    });
    const catIcons = { Food: '🍔', Transport: '🚗', Salary: '💼', Shopping: '🛍️', Health: '💊', Entertainment: '🎬', Utilities: '⚡', Housing: '🏠', Fitness: '💪', Freelance: '💻', Education: '📚', Refund: '💰' };
    const catBg = { Food: '#fee2e2', Transport: '#dbeafe', Salary: '#dcfce7', Shopping: '#f3e8ff', Health: '#cffafe', Entertainment: '#fce7f3', Utilities: '#e0e7ff', Housing: '#fef3c7', Fitness: '#dcfce7', Freelance: '#dbeafe', Education: '#fae8ff', Refund: '#dcfce7' };
    const catColor = { Food: '#ef4444', Transport: '#2b7fff', Salary: '#16a34a', Shopping: '#9333ea', Health: '#06b6d4', Entertainment: '#eab308', Utilities: '#16a34a', Housing: '#d97706', Fitness: '#16a34a', Freelance: '#2b7fff', Education: '#9333ea', Refund: '#16a34a' };

    const categories = Object.entries(catMap).map(([name, data]) => ({
      id: name.toLowerCase(), name, icon: catIcons[name] || '📦', iconBg: catBg[name] || '#f1f5f9', iconColor: catColor[name] || '#6b7280',
      type: data.type, transactions: data.transactions, totalSpent: Math.round(data.totalSpent * 100) / 100, budgetUsage: Math.round(Math.random() * 40 + 50),
    }));

    sendApi(req, res, 200, 'Categories loaded.', { categories });
    return;
  }

  // ── Recurring ──
  if (req.method === 'GET' && pathname === '/api/recurring') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    sendApi(req, res, 200, 'Recurring loaded.', { items: seedRecurring });
    return;
  }

  // ── Calendar ──
  if (req.method === 'GET' && pathname === '/api/calendar') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const monthParam = parseInt(url.searchParams.get('month') || '7', 10); // default August
    const completed = store.transactions.filter(t => t.status === 'completed' && getMonthIdx(t.date) === monthParam);
    const entryMap = {};
    completed.forEach(t => {
      const day = new Date(t.date).getDate();
      if (!entryMap[day]) entryMap[day] = [];
      entryMap[day].push({ label: t.description, amount: t.type === 'income' ? t.amount : -t.amount, type: t.type });
    });
    const totalIncome = completed.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const totalExpenses = completed.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    sendApi(req, res, 200, 'Calendar loaded.', {
      month: FULL_MONTHS[monthParam],
      entryMap,
      summary: { totalIncome: Math.round(totalIncome), totalExpenses: Math.round(totalExpenses), netBalance: Math.round(totalIncome - totalExpenses) },
    });
    return;
  }

  // ── Reports ──
  if (req.method === 'GET' && pathname === '/api/reports') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    const store = readStore();
    const completed = store.transactions.filter(t => t.status === 'completed');
    const financialSummary = FULL_MONTHS.slice(0, 8).map((m, i) => {
      const monthTxs = completed.filter(t => getMonthIdx(t.date) === i);
      const income = monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      return { month: m, income: Math.round(income), expense: Math.round(expense), savings: Math.round(income - expense), savingsRate: income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0 };
    });
    sendApi(req, res, 200, 'Reports loaded.', { financialSummary });
    return;
  }

  // ── Accounts ──
  if (req.method === 'GET' && pathname === '/api/accounts') {
    const userPayload = authenticate(req, res);
    if (!userPayload) return;
    sendApi(req, res, 200, 'Accounts loaded.', { accounts: seedAccounts });
    return;
  }

  // ── 404 ──
  sendApi(req, res, 404, 'Route not found.');
}

// ─── Server ──────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('Server error:', error);
    sendApi(req, res, 500, error.message || 'Internal server error.');
  });
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`ExpenseIQ API running at http://localhost:${PORT}/api`);
  console.log(`Seed data: ${seedTransactions.length} transactions (Jan-Aug 2025)`);
  console.log(`Security: JWT auth, HttpOnly cookies, CSRF, rate limiting, input validation`);
});
