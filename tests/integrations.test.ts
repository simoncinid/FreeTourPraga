import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import nock from 'nock';
import { createOrder, cancelReservation } from '../src/lib/platform/booking';
import { readState, transaction, initialState } from '../src/lib/platform/store';
import { preparePayment, stripe, stripeWebhook } from '../src/lib/platform/providers';
import { checkoutSchema } from '../src/lib/platform/validation';
import { reservationIcs } from '../src/lib/platform/calendar';
let temp: string;
before(async () => {
 temp = await mkdtemp(join(tmpdir(),'ftp-integrations-'));
 process.env.PLATFORM_STORAGE = 'local';
 process.env.PLATFORM_DATA_FILE = join(temp,'state.json');
 process.env.STRIPE_SECRET_KEY = 'sk_test_local_mock';
 process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_mock';
 process.env.SESSION_SECRET = 'local-test-session-secret-with-at-least-32-characters';
 await transaction(s => {
  Object.assign(s, initialState());
  for (const t of s.tours) for (const slot of t.slots) {
   slot.startsAt = new Date(Date.now()+7*86400000).toISOString();
   slot.endsAt = new Date(Date.now()+7*86400000+7200000).toISOString();
  }
 });
 nock.disableNetConnect();
});
after(async () => { nock.enableNetConnect(); nock.cleanAll(); await rm(temp,{recursive:true,force:true}); });
const input = () => checkoutSchema.parse({items:[{tourSlug:'citta-vecchia-ponte-carlo',slotId:'old-town-4',adults:1}],name:'Cliente Test',email:'cliente@example.com',phone:'+393331234567',paymentMethod:'stripe',termsAccepted:true});
test('Stripe Checkout creates one matching session, queues clickable payment email and calendar, then fulfills signed event', async () => {
 const order = await createOrder(input(),randomUUID());
 const mock = nock('https://api.stripe.com',{reqheaders:{'idempotency-key':`checkout:${order.id}`}})
  .post('/v1/checkout/sessions', body => body.mode==='payment' && body['line_items[0][price_data][unit_amount]']==='2900' && body['metadata[orderId]']===order.id)
  .reply(200,{id:'cs_test_mock',url:'https://checkout.stripe.com/c/pay/cs_test_mock',expires_at:Math.floor(Date.now()/1000)+1800});
 const prepared = await preparePayment(order.id);
 assert.equal(prepared.paymentUrl,'https://checkout.stripe.com/c/pay/cs_test_mock');
 await preparePayment(order.id);
 assert.ok(mock.isDone());
 let state = await readState();
 const emails = state.jobs.filter(j => j.type==='email' && j.bookingPnr===order.pnrs[0]);
 assert.equal(emails.length,1);
 assert.match(emails[0].html!,/href="https:\/\/checkout.stripe.com\/c\/pay\/cs_test_mock"/);
 assert.match(emails[0].calendar!,/STATUS:TENTATIVE/);
 const payload=JSON.stringify({id:'evt_mock_fulfilled',type:'checkout.session.completed',data:{object:{id:'cs_test_mock',metadata:{orderId:order.id},amount_total:order.totalCents,currency:'eur',payment_status:'paid',payment_intent:'pi_mock'}}});
 const signature=stripe().webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET!});
 await stripeWebhook(payload,signature);
 await stripeWebhook(payload,signature);
 state=await readState();
 const booking=state.bookings.find(b=>b.orderId===order.id)!;
 assert.equal(booking.paymentStatus,'paid');
 assert.match(reservationIcs(state,booking),/STATUS:CONFIRMED/);
 assert.equal(state.jobs.filter(j=>j.bookingPnr===booking.pnr && j.to===booking.email).length,2);
 assert.match(reservationIcs(state,booking),/SEQUENCE:1/);
});
test('cancelled and expired orders cannot return a stale Stripe payment URL',async()=>{
 const state=await readState();
 const booking=state.bookings[0];
 await cancelReservation(booking.pnr,'Test cancellazione','qa-staff');
 await assert.rejects(()=>preparePayment(booking.orderId),/scaduta o cancellata/);
 const order=await createOrder(input(),randomUUID());
 await transaction(s=>{s.orders.find(o=>o.id===order.id)!.expiresAt=new Date(0).toISOString();});
 await assert.rejects(()=>preparePayment(order.id),/scaduta o cancellata/);
});
test('preview rejects live Stripe charges before creating a reservation',async()=>{
 const before=(await readState()).bookings.length;
 process.env.SITE_PREVIEW='true';process.env.STRIPE_SECRET_KEY='sk_live_must_never_be_used';
 try { await assert.rejects(()=>createOrder(input(),randomUUID()),/solo pagamenti Stripe di prova/); }
 finally { delete process.env.SITE_PREVIEW; process.env.STRIPE_SECRET_KEY='sk_test_local_mock'; }
 assert.equal((await readState()).bookings.length,before);
});
