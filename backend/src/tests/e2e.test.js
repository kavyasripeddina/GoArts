// GoArts AI - Comprehensive End-to-End Test Suite
import bcrypt from 'bcryptjs';
import { saveItem, newId, now } from '../db/inMemoryDb.js';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server.js';
import { connectMongo, closeMongo } from '../db/mongo.js';
import { loadAllFromMongo } from '../db/inMemoryDb.js';

let server;
let baseUrl;

const uniqueId = Date.now();
const testCustomer = {
  name: 'Test Customer E2E',
  email: `cust_${uniqueId}@goartstest.ai`,
  password: 'GoArts_Test#2026$',
  role: 'customer',
  phone: '9876543210',
  city: 'Hyderabad',
};

const testArtist = {
  name: 'Test Artist E2E',
  email: `artist_${uniqueId}@goartstest.ai`,
  password: 'GoArts_Test#2026$',
  role: 'artist',
  phone: '9876543211',
  city: 'Hyderabad',
};

let customerToken = '';
let customerUser = null;
let artistToken = '';
let artistUser = null;
let artistProfile = null;
let testBooking = null;

async function cleanTestData() {
  const { getMongoDb } = await import('../db/mongo.js');
  const db = getMongoDb();

  if (!db) {
    console.log('Test database is not connected.');
    return;
  }

  // Safety check: never delete data from the production database
  if (db.databaseName !== 'goarts_test') {
    throw new Error(
      `Unsafe cleanup blocked! Connected database: ${db.databaseName}`
    );
  }

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }

  console.log('🧹 Test database cleaned safely.');
}

before(async () => {
  process.env.NODE_ENV = 'test';
  const testDb = await connectMongo();

if (!testDb || testDb.databaseName !== 'goarts_test') {
  throw new Error('Tests aborted: Not connected to goarts_test database.');
}
  await cleanTestData();
  await loadAllFromMongo();

  // Create a temporary admin account for testing
const adminPassword = 'GoArts_Test_Admin#2026$';

await saveItem('users', {
  id: newId(),
  name: 'Test Admin',
  email: 'admin-test@goartstest.ai',
  password: await bcrypt.hash(adminPassword, 10),
  role: 'admin',
  isActive: true,
  isVerified: true,
  createdAt: now(),
  updatedAt: now(),
});

console.log('🧪 Temporary test admin created.');

  await new Promise((resolve) => {
    // Listen on port 0 to get an available random ephemeral port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`\n🧪 Test server running at ${baseUrl}`);
      resolve();
    });
  });
});

// after(async () => {
//   if (server) {
//     await new Promise((resolve) => server.close(resolve));
//   }
//   await cleanTestData();
//   await closeMongo();
//   setTimeout(() => process.exit(0), 100);
// });

// Helper for HTTP JSON requests
async function req(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

// ── 1. AUTHENTICATION & CREDENTIAL PERSISTENCE ─────────────────
test('1.0 Weak Password Rejected with 400', async () => {
  const weakRes = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Weak Password User',
      email: `weak_${Date.now()}@example.com`,
      password: 'weak',
      role: 'customer',
    },
  });
  assert.equal(weakRes.status, 400, 'Weak password should be rejected with 400');
  const errorMsg = weakRes.data.error || weakRes.data.message || '';
  assert.ok(errorMsg.includes('Password must be at least 8 characters'));
});

test('1.1 Customer and Artist Registration', async () => {
  // Register Customer
  const cRes = await req('/auth/register', { method: 'POST', body: testCustomer });
  assert.equal(cRes.status, 201, `Customer register failed: ${JSON.stringify(cRes.data)}`);
  assert.ok(cRes.data.token, 'Customer should receive a token');
  assert.equal(cRes.data.user.email, testCustomer.email);
  assert.equal(cRes.data.user.role, 'customer');
  customerToken = cRes.data.token;
  customerUser = cRes.data.user;

  // Register Artist
  const aRes = await req('/auth/register', { method: 'POST', body: testArtist });
  assert.equal(aRes.status, 201, `Artist register failed: ${JSON.stringify(aRes.data)}`);
  assert.ok(aRes.data.token, 'Artist should receive a token');
  assert.equal(aRes.data.user.email, testArtist.email);
  assert.equal(aRes.data.user.role, 'artist');
  artistToken = aRes.data.token;
  artistUser = aRes.data.user;
});

test('1.2 Artist Profile Auto-Creation and Fetching', async () => {
  const profileRes = await req('/artists/my', { token: artistToken });
  assert.equal(profileRes.status, 200);
  assert.ok(profileRes.data.artist, 'Artist profile should exist');
  assert.equal(profileRes.data.artist.userId, artistUser.id);
  artistProfile = profileRes.data.artist;
});

test('1.3 Simulated Server Restart & Credential Persistence', async () => {
  // Simulate complete in-memory wipe and reload directly from MongoDB Compass
  const loaded = await loadAllFromMongo();
  assert.ok(loaded > 0, 'Should load documents from MongoDB');

  // Customer Login after restart
  const cLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: testCustomer.email, password: testCustomer.password },
  });
  assert.equal(cLogin.status, 200, `Customer login failed after restart: ${JSON.stringify(cLogin.data)}`);
  assert.equal(cLogin.data.user.id, customerUser.id);
  customerToken = cLogin.data.token;

  // Artist Login after restart
  const aLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: testArtist.email, password: testArtist.password },
  });
  assert.equal(aLogin.status, 200, `Artist login failed after restart: ${JSON.stringify(aLogin.data)}`);
  assert.equal(aLogin.data.user.id, artistUser.id);
  artistToken = aLogin.data.token;
});

test('1.4 Identity and Role Verification via /auth/me', async () => {
  const cMe = await req('/auth/me', { token: customerToken });
  assert.equal(cMe.status, 200);
  assert.equal(cMe.data.user.role, 'customer');
  assert.equal(cMe.data.user.name, testCustomer.name);

  const aMe = await req('/auth/me', { token: artistToken });
  assert.equal(aMe.status, 200);
  assert.equal(aMe.data.user.role, 'artist');
  assert.equal(aMe.data.user.name, testArtist.name);
});

test('1.5 Role Separation & Route Guard Enforcement', async () => {
  // Customer must NOT be able to access artist profile route
  const cArtistAccess = await req('/artists/my', { token: customerToken });
  assert.equal(cArtistAccess.status, 403, 'Customer accessing /artists/my must be rejected with 403');

  // Customer must NOT be able to access admin overview
  const cAdminAccess = await req('/admin/overview', { token: customerToken });
  assert.equal(cAdminAccess.status, 403, 'Customer accessing /admin must be rejected with 403');

  // Unauthenticated request must be rejected with 401
  const noAuth = await req('/bookings/my');
  assert.equal(noAuth.status, 401, 'Unauthenticated request must be rejected with 401');
});

// ── 2. NOTIFICATIONS & READ STATUS PERSISTENCE ──────────────────
test('2.1 Notifications Isolation by User', async () => {
  const cNotifs = await req('/notifications', { token: customerToken });
  assert.equal(cNotifs.status, 200);
  // All notifications returned must strictly belong to the customer
  for (const n of cNotifs.data.notifications) {
    assert.equal(n.userId, customerUser.id, 'Notification must belong strictly to authenticated customer');
  }

  const aNotifs = await req('/notifications', { token: artistToken });
  assert.equal(aNotifs.status, 200);
  for (const n of aNotifs.data.notifications) {
    assert.equal(n.userId, artistUser.id, 'Notification must belong strictly to authenticated artist');
  }
});

test('2.2 Persistent Read Status on Notifications', async () => {
  // Mark all notifications as read for artist
  const markRes = await req('/notifications/read-all', { method: 'PUT', token: artistToken });
  assert.equal(markRes.status, 200);

  // Reload from MongoDB to simulate reload/restart
  await loadAllFromMongo();

  const refreshedNotifs = await req('/notifications', { token: artistToken });
  assert.equal(refreshedNotifs.status, 200);
  for (const n of refreshedNotifs.data.notifications) {
    assert.equal(n.isRead, true, 'isRead must persist in MongoDB after server reload');
  }
});

// ── 3. BOOKING REQUEST & QUOTATION WORKFLOW ────────────────────
test('3.1 Customer Booking Request Creation', async () => {
  const bookingData = {
    artistId: artistProfile.id,
    eventType: 'Corporate Gala',
    eventDate: '2026-11-20',
    budget: 35000,
    duration: 3,
    audienceSize: 200,
    languagePreference: 'English & Hindi',
    specialRequirements: 'High quality sound setup required',
  };

  const bRes = await req('/bookings', { method: 'POST', token: customerToken, body: bookingData });
  assert.equal(bRes.status, 201, `Create booking failed: ${JSON.stringify(bRes.data)}`);
  assert.equal(bRes.data.booking.status, 'requested');
  assert.equal(bRes.data.booking.customerId, customerUser.id);
  assert.equal(bRes.data.booking.artistId, artistProfile.id);
  testBooking = bRes.data.booking;

  // Verify Artist received new_booking notification
  const aNotifs = await req('/notifications', { token: artistToken });
  const hasNewBookingNotif = aNotifs.data.notifications.some(
    (n) => n.type === 'new_booking' && n.message.includes(testCustomer.name)
  );
  assert.ok(hasNewBookingNotif, 'Artist should receive notification with customer name');
});

test('3.1.1 Advance Payment Blocked while Booking Status is "requested"', async () => {
  // Customer attempts to pay advance on a booking that is still in 'requested' state
  const prematurePay = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'advance', paymentMethod: 'UPI' },
  });
  assert.equal(prematurePay.status, 400, 'Advance payment before artist accepts/quotes must be rejected with 400');
  const errorMsg = prematurePay.data.error || '';
  assert.ok(
    errorMsg.includes('not accepted or quoted') || errorMsg.includes('Advance payment is only enabled'),
    `Expected acceptance gate error message, got: ${errorMsg}`
  );
});

test('3.2 Artist Submits Quotation with Authoritative Price', async () => {
  // Test invalid quotation price (negative or non-number)
  const invalidRes = await req(`/bookings/${testBooking.id}/status`, {
    method: 'PUT',
    token: artistToken,
    body: { status: 'quoted', quotedPrice: -500 },
  });
  assert.equal(invalidRes.status, 400, 'Negative quotation must be rejected with 400');

  // Customer cannot send a quote for an artist
  const unauthRes = await req(`/bookings/${testBooking.id}/status`, {
    method: 'PUT',
    token: customerToken,
    body: { status: 'quoted', quotedPrice: 40000 },
  });
  assert.equal(unauthRes.status, 403, 'Customer cannot quote their own booking');

  // Valid quotation by Artist
  const quoteRes = await req(`/bookings/${testBooking.id}/status`, {
    method: 'PUT',
    token: artistToken,
    body: {
      status: 'quoted',
      quotedPrice: 40000,
      artistNote: 'Includes full sound system and 3 vocalists',
    },
  });
  assert.equal(quoteRes.status, 200, `Send quote failed: ${JSON.stringify(quoteRes.data)}`);
  assert.equal(quoteRes.data.booking.status, 'quoted');
  assert.equal(quoteRes.data.booking.quotedPrice, 40000);
  assert.equal(quoteRes.data.booking.artistNote, 'Includes full sound system and 3 vocalists');
  testBooking = quoteRes.data.booking;

  // Verify Customer received booking_quoted notification
  const cNotifs = await req('/notifications', { token: customerToken });
  const quoteNotif = cNotifs.data.notifications.find((n) => n.type === 'booking_quoted');
  assert.ok(quoteNotif, 'Customer should receive booking_quoted notification');
  assert.ok(quoteNotif.message.includes('₹40,000'), 'Quote notification must show the quoted amount');
});

test('3.3 Quotation Synchronization Across Dashboards', async () => {
  // Customer fetching booking details
  const cGet = await req(`/bookings/${testBooking.id}`, { token: customerToken });
  assert.equal(cGet.status, 200);
  assert.equal(cGet.data.booking.status, 'quoted');
  assert.equal(cGet.data.booking.quotedPrice, 40000);
  assert.equal(cGet.data.booking.advanceAmount, 20000);

  // Artist fetching booking details
  const aGet = await req(`/bookings/${testBooking.id}`, { token: artistToken });
  assert.equal(aGet.status, 200);
  assert.equal(aGet.data.booking.status, 'quoted');
  assert.equal(aGet.data.booking.quotedPrice, 40000);
});

// ── 4. MUTUAL AGREEMENT DIRECT CHAT ────────────────────────────
test('4.1 Chat is Locked Before Mutual Agreement', async () => {
  const msgRes = await req(`/bookings/${testBooking.id}/messages`, {
    method: 'POST',
    token: customerToken,
    body: { text: 'Hello artist!' },
  });
  assert.equal(msgRes.status, 403, 'Chat message before agreement must be rejected with 403');
});

test('4.2 Customer Initiates Chat Request', async () => {
  const cReq = await req(`/bookings/${testBooking.id}/chat/request`, {
    method: 'POST',
    token: customerToken,
  });
  assert.equal(cReq.status, 200);
  assert.equal(cReq.data.chatEnabled, false, 'Chat should not be enabled yet');
  assert.equal(cReq.data.booking.chatRequestedBy, 'customer');

  // Verify Artist received chat_request notification
  const aNotifs = await req('/notifications', { token: artistToken });
  const chatNotif = aNotifs.data.notifications.find(
    (n) => n.type === 'chat_request' && n.message.includes(testBooking.id.slice(0, 8))
  );
  assert.ok(chatNotif, 'Artist should receive chat_request notification');
});

test('4.3 Artist Accepts Chat Request & Unlocks Direct Chat', async () => {
  const aReq = await req(`/bookings/${testBooking.id}/chat/request`, {
    method: 'POST',
    token: artistToken,
  });
  assert.equal(aReq.status, 200);
  assert.equal(aReq.data.chatEnabled, true, 'Chat should now be unlocked!');
  assert.equal(aReq.data.booking.chatRequestedBy, 'both');
  testBooking = aReq.data.booking;
});

test('4.4 Bidirectional Messaging with Persistence', async () => {
  // Customer sends message
  const cMsg = await req(`/bookings/${testBooking.id}/messages`, {
    method: 'POST',
    token: customerToken,
    body: { text: 'Hello, looking forward to the gala!' },
  });
  assert.equal(cMsg.status, 201);
  assert.equal(cMsg.data.message.senderRole, 'customer');

  // Artist sends reply
  const aMsg = await req(`/bookings/${testBooking.id}/messages`, {
    method: 'POST',
    token: artistToken,
    body: { text: 'Thank you! We will arrive 1 hour early for sound check.' },
  });
  assert.equal(aMsg.status, 201);
  assert.equal(aMsg.data.message.senderRole, 'artist');

  // Simulate server restart to ensure chat messages persisted in MongoDB
  await loadAllFromMongo();

  // Retrieve message history
  const history = await req(`/bookings/${testBooking.id}/messages`, { token: customerToken });
  assert.equal(history.status, 200);
  assert.equal(history.data.messages.length, 2, 'Both messages must persist and be retrieved');
  assert.equal(history.data.messages[0].text, 'Hello, looking forward to the gala!');
  assert.equal(history.data.messages[1].text, 'Thank you! We will arrive 1 hour early for sound check.');

  // Unrelated user cannot read chat
  // Register a third party user
  const thirdParty = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Intruder User',
      email: `intruder_${uniqueId}@goarts.ai`,
      password: 'GoArts_Test#2026$',
      role: 'customer',
    },
  });
  const unauthChat = await req(`/bookings/${testBooking.id}/messages`, { token: thirdParty.data.token });
  assert.equal(unauthChat.status, 403, 'Unrelated user must be blocked with 403');
});

// ── 5. MILESTONE PAYMENTS (50% ADVANCE & 50% BALANCE) ──────────
test('5.1 Customer Pays 50% Advance', async () => {
  const payRes = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'advance', paymentMethod: 'UPI' },
  });
  assert.equal(payRes.status, 200, `Pay advance failed: ${JSON.stringify(payRes.data)}`);
  assert.equal(payRes.data.success, true);
  assert.equal(payRes.data.payment.amount, 20000, '50% of ₹40,000 must be ₹20,000');
  assert.equal(payRes.data.booking.paymentStatus, 'advance_paid');
  assert.equal(payRes.data.booking.status, 'confirmed', 'Booking status should transition to confirmed');
  assert.equal(payRes.data.booking.paidAmount, 20000);
  assert.equal(payRes.data.booking.balanceAmount, 20000);
  testBooking = payRes.data.booking;
});

test('5.2 Reject Duplicate Advance Payment', async () => {
  const dupRes = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'advance', paymentMethod: 'Credit Card' },
  });
  assert.equal(dupRes.status, 400, 'Duplicate advance payment must be rejected with 400');
});

test('5.3 Reject Balance Payment Before Performance Completion', async () => {
  const balRes = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'balance', paymentMethod: 'UPI' },
  });
  assert.equal(balRes.status, 400, 'Balance payment before performance completion must be rejected with 400');
});

test('5.3.1 Reject Review Before Performance Completion', async () => {
  const earlyReview = await req(`/bookings/${testBooking.id}/review`, {
    method: 'POST',
    token: customerToken,
    body: { rating: 5, comment: 'Premature review before show' },
  });
  assert.equal(earlyReview.status, 400, 'Review before performance completed must be rejected with 400');
});

test('5.4 Performance Marked Completed & Customer Pays 50% Balance', async () => {
  // Artist marks performance completed
  const completeRes = await req(`/bookings/${testBooking.id}/status`, {
    method: 'PUT',
    token: artistToken,
    body: { status: 'completed' },
  });
  assert.equal(completeRes.status, 200);
  assert.equal(completeRes.data.booking.status, 'completed');

  // Customer pays 50% remaining balance
  const balPayRes = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'balance', paymentMethod: 'Net Banking' },
  });
  assert.equal(balPayRes.status, 200, `Pay balance failed: ${JSON.stringify(balPayRes.data)}`);
  assert.equal(balPayRes.data.booking.paymentStatus, 'fully_paid');
  assert.equal(balPayRes.data.booking.paidAmount, 40000);
  assert.equal(balPayRes.data.booking.balanceAmount, 0);
  testBooking = balPayRes.data.booking;

  // Duplicate balance payment rejected
  const dupBal = await req(`/bookings/${testBooking.id}/pay`, {
    method: 'POST',
    token: customerToken,
    body: { milestone: 'balance', paymentMethod: 'UPI' },
  });
  assert.equal(dupBal.status, 400, 'Payment on already fully paid booking must be rejected with 400');
});

test('5.5 Customer Leaves Rating & Review', async () => {
  const revRes = await req(`/bookings/${testBooking.id}/review`, {
    method: 'POST',
    token: customerToken,
    body: { rating: 5, comment: 'Incredible performance, our guests loved it!' },
  });
  assert.equal(revRes.status, 201);
  assert.equal(revRes.data.review.rating, 5);

  // Duplicate review rejected
  const dupRev = await req(`/bookings/${testBooking.id}/review`, {
    method: 'POST',
    token: customerToken,
    body: { rating: 4, comment: 'Second review' },
  });
  assert.equal(dupRev.status, 409, 'Duplicate review must be rejected with 409');
});

// ── 6. AADHAAR IDENTITY VERIFICATION & ROLE UNIQUENESS ────────
test('6.1 Invalid Aadhaar Format Rejected', async () => {
  const invalidRes = await req('/auth/verify-aadhaar', {
    method: 'POST',
    token: customerToken,
    body: {
      legalName: testCustomer.name,
      aadhaarNumber: '1234abcd', // not 12 numeric digits
    },
  });
  assert.equal(invalidRes.status, 400, 'Invalid Aadhaar format must return 400');
});

test('6.2 Role-Based Aadhaar Uniqueness Enforcement', async () => {
  const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
  const sharedAadhaar = `88887777${randomSuffix}`;

  // Step A: Customer 1 verifies Aadhaar
  const c1Verify = await req('/auth/verify-aadhaar', {
    method: 'POST',
    token: customerToken,
    body: {
      legalName: testCustomer.name,
      aadhaarNumber: sharedAadhaar,
    },
  });
  assert.equal(c1Verify.status, 200, `Customer 1 verification failed: ${JSON.stringify(c1Verify.data)}`);
  assert.equal(c1Verify.data.user.aadhaarVerified, true);
  assert.equal(c1Verify.data.user.aadhaarData.maskedNumber, `XXXX-XXXX-${randomSuffix}`);

  // Step B: Customer 2 attempts to verify the SAME Aadhaar -> MUST BE REJECTED (409)
  const cust2Reg = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Second Customer',
      email: `cust2_${uniqueId}@goartstest.ai`,
      password: 'GoArts_Test#2026$',
      role: 'customer',
    },
  });
  assert.equal(cust2Reg.status, 201);
  const cust2Token = cust2Reg.data.token;

  const c2Verify = await req('/auth/verify-aadhaar', {
    method: 'POST',
    token: cust2Token,
    body: {
      legalName: 'Second Customer Legal',
      aadhaarNumber: sharedAadhaar,
    },
  });
  assert.equal(c2Verify.status, 409, 'Duplicate Aadhaar within customer role must be rejected with 409');
  assert.ok(c2Verify.data.error.includes('already verified on another customer account'));

  // Step C: Artist 1 verifies the SAME Aadhaar -> MUST SUCCEED (200)
  // One individual can hold 1 customer account and 1 artist account with the same real Aadhaar
  const a1Verify = await req('/auth/verify-aadhaar', {
    method: 'POST',
    token: artistToken,
    body: {
      legalName: testArtist.name,
      aadhaarNumber: sharedAadhaar,
    },
  });
  assert.equal(a1Verify.status, 200, `Artist with same Aadhaar should be accepted: ${JSON.stringify(a1Verify.data)}`);
  assert.equal(a1Verify.data.user.aadhaarVerified, true);

  // Step D: Artist 2 attempts to verify the SAME Aadhaar -> MUST BE REJECTED (409)
  const artist2Reg = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Second Artist',
      email: `artist2_${uniqueId}@goartstest.ai`,
      password: 'GoArts_Test#2026$',
      role: 'artist',
    },
  });
  assert.equal(artist2Reg.status, 201);
  const artist2Token = artist2Reg.data.token;

  const a2Verify = await req('/auth/verify-aadhaar', {
    method: 'POST',
    token: artist2Token,
    body: {
      legalName: 'Second Artist Legal',
      aadhaarNumber: sharedAadhaar,
    },
  });
  assert.equal(a2Verify.status, 409, 'Duplicate Aadhaar within artist role must be rejected with 409');
  assert.ok(a2Verify.data.error.includes('already verified on another artist account'));
});

// ── 7. ADMIN EXECUTIVE ANALYTICS & ESCROW METRICS ─────────────
test('7.1 Admin Overview returns Escrow Milestones and KYC Health', async () => {
  // Admin Login
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin-test@goartstest.ai',
      password: 'GoArts_Test_Admin#2026$',
    },
  });
  assert.equal(adminLogin.status, 200, 'Admin login failed');
  const adminToken = adminLogin.data.token;

  const overviewRes = await req('/admin/overview?period=all', { token: adminToken });
  assert.equal(overviewRes.status, 200);
  assert.ok(overviewRes.data.grossBookingValue >= 0);
  assert.ok(overviewRes.data.platformRevenue >= 0);
  assert.ok(overviewRes.data.verifiedArtistsCount !== undefined, 'Should include verifiedArtistsCount');
  assert.ok(overviewRes.data.verifiedCustomersCount !== undefined, 'Should include verifiedCustomersCount');
  assert.ok(overviewRes.data.totalEscrowAdvanceCollected !== undefined, 'Should include totalEscrowAdvanceCollected');
  assert.ok(overviewRes.data.totalEscrowBalanceSettled !== undefined, 'Should include totalEscrowBalanceSettled');
});

after(async () => {
  await cleanTestData();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeMongo();
});

