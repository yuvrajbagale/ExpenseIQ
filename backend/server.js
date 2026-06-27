const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT || 5000);
const DATA_FILE = path.join(__dirname, 'data.json');

const seedTransactions = [
  { id: '001', type: 'income', category: 'Salary', description: 'Salary Deposit', amount: 5200, date: '2025-06-10T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'salary'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: '002', type: 'expense', category: 'Food', description: 'Grocery Store', amount: 84.5, date: '2025-06-11T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['food', 'groceries'], isRecurring: false },
  { id: '003', type: 'expense', category: 'Utilities', description: 'Electricity Bill', amount: 120, date: '2025-06-09T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities', 'bills'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: '004', type: 'expense', category: 'Transport', description: 'Uber Ride', amount: 18.75, date: '2025-06-09T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['transport'], isRecurring: false },
  { id: '005', type: 'expense', category: 'Utilities', description: 'Electricity bill - June', amount: 65, date: '2025-06-28T00:00:00.000Z', paymentMethod: 'upi', status: 'completed', tags: ['utilities'], isRecurring: false },
  { id: '006', type: 'expense', category: 'Entertainment', description: 'Netflix subscription', amount: 15.99, date: '2025-06-25T00:00:00.000Z', paymentMethod: 'card', status: 'completed', tags: ['entertainment', 'subscription'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: '007', type: 'expense', category: 'Health', description: 'Pharmacy - vitamins', amount: 34.5, date: '2025-06-22T00:00:00.000Z', paymentMethod: 'cash', status: 'completed', tags: ['health'], isRecurring: false },
  { id: '008', type: 'income', category: 'Freelance', description: 'Freelance Payment', amount: 1200, date: '2025-06-15T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['income', 'freelance'], isRecurring: false },
  { id: '009', type: 'expense', category: 'Housing', description: 'Monthly apartment rent', amount: 1200, date: '2025-06-01T00:00:00.000Z', paymentMethod: 'bank', status: 'completed', tags: ['housing', 'rent'], isRecurring: true, recurringFrequency: 'monthly' },
  { id: '010', type: 'expense', category: 'Fitness', description: 'Gym membership - monthly', amount: 49, date: '2025-05-31T00:00:00.000Z', paymentMethod: 'card', status: 'pending', tags: ['fitness', 'health'], isRecurring: true, recurringFrequency: 'monthly' },
];

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

function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function sendApi(req, res, status, message, data = null) {
  res.writeHead(status, {
    ...corsHeaders(req),
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({
    success: status < 400,
    message,
    data,
    timestamp: new Date().toISOString(),
  }));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

function isAuthed(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ');
}

function requireAuth(req, res) {
  if (isAuthed(req)) {
    return true;
  }

  sendApi(req, res, 401, 'Missing or invalid authorization token.');
  return false;
}

function deriveName(email) {
  const local = String(email || 'user').split('@')[0] || 'User';
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return name || 'Demo User';
}

function deriveInitials(email) {
  const local = String(email || 'user').split('@')[0] || 'U';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function normalizeTransaction(body) {
  return {
    id: String(body.id || randomUUID()),
    type: body.type === 'income' ? 'income' : 'expense',
    category: String(body.category || 'Food'),
    subCategory: body.subCategory ? String(body.subCategory) : undefined,
    description: String(body.description || 'New transaction'),
    amount: Number(body.amount || 0),
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    paymentMethod: ['cash', 'card', 'upi', 'bank'].includes(body.paymentMethod) ? body.paymentMethod : 'cash',
    status: ['completed', 'pending', 'failed'].includes(body.status) ? body.status : 'completed',
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    location: body.location ? String(body.location) : undefined,
    receiptUrl: body.receiptUrl ? String(body.receiptUrl) : undefined,
    isRecurring: Boolean(body.isRecurring),
    recurringFrequency: body.recurringFrequency ? String(body.recurringFrequency) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  };
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendApi(req, res, 200, 'ExpenseIQ API is running.', { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      sendApi(req, res, 400, 'Email and password are required.');
      return;
    }

    const store = readStore();
    let user = store.users.find((item) => item.email === email);

    if (!user) {
      user = {
        id: randomUUID(),
        email,
        name: deriveName(email),
        initials: deriveInitials(email),
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      writeStore(store);
    }

    sendApi(req, res, 200, 'Login successful.', {
      user,
      token: `dev-token-${randomUUID()}`,
    });
    return;
  }

  if (pathname === '/api/transactions') {
    if (!requireAuth(req, res)) {
      return;
    }

    if (req.method === 'GET') {
      const store = readStore();
      sendApi(req, res, 200, 'Transactions loaded.', store.transactions);
      return;
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const transaction = normalizeTransaction(body);

      if (!transaction.amount || transaction.amount <= 0) {
        sendApi(req, res, 400, 'Transaction amount must be greater than zero.');
        return;
      }

      const store = readStore();
      store.transactions.unshift(transaction);
      writeStore(store);
      sendApi(req, res, 201, 'Transaction created.', transaction);
      return;
    }
  }

  const transactionMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
  if (transactionMatch && req.method === 'DELETE') {
    if (!requireAuth(req, res)) {
      return;
    }

    const id = decodeURIComponent(transactionMatch[1]);
    const store = readStore();
    const originalLength = store.transactions.length;
    store.transactions = store.transactions.filter((transaction) => transaction.id !== id);

    if (store.transactions.length === originalLength) {
      sendApi(req, res, 404, 'Transaction not found.');
      return;
    }

    writeStore(store);
    sendApi(req, res, 200, 'Transaction deleted.', { id });
    return;
  }

  sendApi(req, res, 404, 'Route not found.');
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendApi(req, res, 500, error.message || 'Internal server error.');
  });
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`ExpenseIQ API running at http://localhost:${PORT}/api`);
});
