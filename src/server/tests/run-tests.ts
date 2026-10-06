import { db } from '../database/db.ts';
import { WalletService } from '../wallet/WalletService.ts';
import { ParityEngine } from '../games/win-go/ParityEngine.ts';
import { PayoutEngine } from '../games/win-go/PayoutEngine.ts';
import { CrashEngine } from '../games/aviator/CrashEngine.ts';
import { TrajectoryEngine } from '../games/aviator/TrajectoryEngine.ts';
import { winGoManager } from '../games/win-go/WinGoRoundManager.ts';
import { aviatorManager } from '../games/aviator/AviatorRoundManager.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

async function runWalletTests() {
  console.log('\n--- SUITE 1: WALLET & ATOMIC CONCURRENCY ---');
  const testAccId = 'test_acc_wallet_' + Date.now();
  const acc = await WalletService.getOrCreateAccount(testAccId);

  assert(acc.wallet_balance === 1000.0, 'Initial balance is exactly 1000.00 virtual credits');

  // Place valid bet
  const bet1 = await WalletService.placeBet({
    accountId: testAccId,
    amount: 100.0,
    game: 'WIN_GO',
    roundId: 'rnd_1',
    betId: 'bet_1',
    idempotencyKey: 'idem_bet_1',
  });

  assert(bet1.success && bet1.newBalance === 900.0, 'Valid bet deducted: 1000.00 -> 900.00');

  // Duplicate idempotency check
  const bet1Dup = await WalletService.placeBet({
    accountId: testAccId,
    amount: 100.0,
    game: 'WIN_GO',
    roundId: 'rnd_1',
    betId: 'bet_1',
    idempotencyKey: 'idem_bet_1',
  });
  assert(bet1Dup.success && bet1Dup.newBalance === 900.0, 'Duplicate idempotency does not double-deduct');

  // Insufficient balance check
  const betOver = await WalletService.placeBet({
    accountId: testAccId,
    amount: 1500.0,
    game: 'WIN_GO',
    roundId: 'rnd_2',
    betId: 'bet_over',
    idempotencyKey: 'idem_bet_over',
  });
  assert(!betOver.success, 'Insufficient balance rejected properly');

  // Credit winning payout
  const win = await WalletService.creditWin({
    accountId: testAccId,
    payoutAmount: 450.0,
    game: 'WIN_GO',
    roundId: 'rnd_1',
    betId: 'bet_1',
    idempotencyKey: 'idem_win_1',
  });
  assert(win.success && win.newBalance === 1350.0, 'Winning payout credited: 900.00 + 450.00 = 1350.00');

  // Verify ledger integrity
  const ledger = WalletService.getLedger(testAccId);
  assert(ledger.length >= 3, 'Ledger recorded every balance transition');
  assert(ledger[0].closing_balance === 1350.0, 'Most recent ledger closing balance matches 1350.00');
}

function runWinGoEngineTests() {
  console.log('\n--- SUITE 2: WIN GO 1MIN PARITY & PAYOUT ENGINE (WITH 2% RAKE) ---');

  for (let i = 0; i <= 9; i++) {
    const outcome = ParityEngine.evaluateOutcome(i);
    assert(outcome.number === i, `Outcome ${i} number mapped correctly`);
    assert(outcome.size === (i <= 4 ? 'SMALL' : 'BIG'), `Outcome ${i} is ${outcome.size}`);
    assert(outcome.parity === (i % 2 === 0 ? 'EVEN' : 'ODD'), `Outcome ${i} is ${outcome.parity}`);
  }

  // Outcome 0 special colors
  const out0 = ParityEngine.evaluateOutcome(0);
  assert(out0.colors.includes('RED') && out0.colors.includes('VIOLET'), 'Outcome 0 has both RED and VIOLET');

  // Payout evaluations with 2% platform handling fee
  // Outcome 0: Red bet gets gross 1.5x, minus 2% rake = 1.47x -> on 100: 147.00
  const evalRed0 = PayoutEngine.evaluateBet('COLOR', 'RED', 100, out0);
  assert(evalRed0.isWon && evalRed0.payoutAmount === 147.0, 'Special 0: RED bet gets 1.47x net payout (147)');

  // Outcome 0: Violet bet gets gross 4.5x, minus 2% rake = 4.41x -> on 100: 441.00
  const evalVio0 = PayoutEngine.evaluateBet('COLOR', 'VIOLET', 100, out0);
  assert(evalVio0.isWon && evalVio0.payoutAmount === 441.0, 'Special 0: VIOLET bet gets 4.41x net payout (441)');

  // Outcome 0: Number 0 bet gets gross 9.0x, minus 2% rake = 8.82x -> on 100: 882.00
  const evalNum0 = PayoutEngine.evaluateBet('NUMBER', '0', 100, out0);
  assert(evalNum0.isWon && evalNum0.payoutAmount === 882.0, 'Number 0 bet gets 8.82x net payout (882)');

  // Outcome 2: Standard Red gets gross 2.0x, minus 2% rake = 1.96x -> on 100: 196.00
  const out2 = ParityEngine.evaluateOutcome(2);
  const evalRed2 = PayoutEngine.evaluateBet('COLOR', 'RED', 100, out2);
  assert(evalRed2.isWon && evalRed2.payoutAmount === 196.0, 'Standard RED (Outcome 2) gets 1.96x payout (196)');

  // Outcome 5: Big bet gets gross 2.0x, minus 2% rake = 1.96x -> on 100: 196.00
  const out5 = ParityEngine.evaluateOutcome(5);
  const evalBig5 = PayoutEngine.evaluateBet('SIZE', 'BIG', 100, out5);
  assert(evalBig5.isWon && evalBig5.payoutAmount === 196.0, 'BIG bet on 5 gets 1.96x payout (196)');
}

function runAviatorEngineTests() {
  console.log('\n--- SUITE 3: AVIATOR TRAJECTORY & CRASH ENGINE (WITH 3% RETENTION) ---');

  // Test crash point range and lower bound
  let minObserved = Infinity;
  let has100Crash = false;
  for (let i = 0; i < 200; i++) {
    const cp = CrashEngine.generateCrashPoint();
    if (cp < minObserved) minObserved = cp;
    if (cp === 1.00) has100Crash = true;
  }
  assert(minObserved >= 1.00, `CrashEngine lower bound >= 1.00x (observed min: ${minObserved})`);

  // Multiplier function tests: exp(0.065 * t)
  const m0 = TrajectoryEngine.getMultiplierAtTime(0);
  assert(m0 === 1.0, 'Multiplier at t=0s is 1.00x');

  const m10 = TrajectoryEngine.getMultiplierAtTime(10);
  assert(Math.abs(m10 - 1.92) < 0.05, `Multiplier at t=10s is ~1.92x (got ${m10}x)`);

  const t2x = TrajectoryEngine.getTimeForMultiplier(2.0);
  assert(Math.abs(t2x - 10.66) < 0.1, `Time to 2x is approx 10.66 seconds (got ${t2x.toFixed(2)}s)`);
}

async function runTurnoverAndAffiliateTests() {
  console.log('\n--- SUITE 4: 1X TURNOVER REQUIREMENT & 3-TIER AFFILIATE ENGINE ---');

  // Test 1X Turnover Requirement
  const userA = 'test_user_turnover_' + Date.now();
  await WalletService.getOrCreateAccount(userA);
  db.updateAccount(userA, { total_deposited: 1000.0, total_wagered: 400.0 });

  const wthFail = await db.createWithdrawalRequest(userA, 200, 'test@upi');
  assert(!wthFail.success && wthFail.turnoverRemaining === 600.0, 'Withdrawal blocked when total_wagered < total_deposited');

  db.updateAccount(userA, { total_wagered: 1200.0 }); // Met turnover
  const wthPass = await db.createWithdrawalRequest(userA, 200, 'test@upi');
  assert(wthPass.success && wthPass.request?.status === 'PENDING', 'Withdrawal accepted when total_wagered >= total_deposited');

  // Test 3-Tier Affiliate Commission
  // Structure: Inviter L1 -> Inviter L2 -> Inviter L3 -> Bettor
  const inviterL1 = 'test_aff_l1_' + Date.now();
  const inviterL2 = 'test_aff_l2_' + Date.now();
  const inviterL3 = 'test_aff_l3_' + Date.now();
  const bettor = 'test_aff_bettor_' + Date.now();

  await WalletService.getOrCreateAccount(inviterL1);
  await WalletService.getOrCreateAccount(inviterL2);
  await WalletService.getOrCreateAccount(inviterL3);
  await WalletService.getOrCreateAccount(bettor);

  // Link referrals directly in database
  db.updateAccount(inviterL2, { referred_by: inviterL1 });
  db.updateAccount(inviterL3, { referred_by: inviterL2 });
  db.updateAccount(bettor, { referred_by: inviterL3 });

  // Bettor places a ₹1000 bet
  db.processAffiliateCommissions(bettor, 1000.0, 'WIN_GO', 'test_bet_aff_01');

  const refreshedL3 = db.getAccount(inviterL3);
  const refreshedL2 = db.getAccount(inviterL2);
  const refreshedL1 = db.getAccount(inviterL1);

  // L3 (Direct): 0.6% of 1000 = ₹6.00
  assert(refreshedL3?.claimable_commission === 6.0, 'Level 1 (Direct Inviter) received 0.6% commission (₹6.00)');

  // L2: 0.3% of 1000 = ₹3.00
  assert(refreshedL2?.claimable_commission === 3.0, 'Level 2 received 0.3% commission (₹3.00)');

  // L1: 0.1% of 1000 = ₹1.00
  assert(refreshedL1?.claimable_commission === 1.0, 'Level 3 received 0.1% commission (₹1.00)');

  // 1-Click claim commission
  const claimRes = await db.claimAffiliateCommission(inviterL3);
  assert(claimRes.success && claimRes.amount === 6.0, 'Claimed affiliate commission credited to wallet atomically');
}

async function runOperatorWarRoomTests() {
  console.log('\n--- SUITE 5: OPERATOR WAR ROOM & OVERRIDES ---');

  // 1. Win Go Live Stakes Breakdown
  const breakdown = winGoManager.getLiveStakesBreakdown();
  assert(breakdown !== null && Array.isArray(breakdown.numbers), 'Win Go live stakes breakdown returned');
  assert(breakdown.liabilities.length === 10, 'Platform payout liabilities computed for all 10 candidate outcomes');

  // 2. Win Go Forced Result Override
  winGoManager.setForcedNumber(7);
  assert(winGoManager.getForcedNumber() === 7, 'Forced next number set to 7');
  winGoManager.setMode('AUTO_RISK_MIN');
  assert(winGoManager.getMode() === 'AUTO_RISK_MIN', 'Win Go mode set to AUTO_RISK_MIN');

  // 3. Aviator Trajectory Controller Override
  aviatorManager.setForcedCrashMultiplier(15.5);
  assert(aviatorManager.getForcedCrashMultiplier() === 15.5, 'Aviator forced crash multiplier set to 15.50x');

  // 4. Aviator Instant Crash Trigger
  const instantRes = await aviatorManager.triggerInstantCrash();
  assert(instantRes.success, 'Aviator instant 1.00x crash trigger succeeded');

  // 5. Attendance Calendar
  const attUser = 'test_att_' + Date.now();
  await WalletService.getOrCreateAccount(attUser);
  const attRes = db.claimAttendanceReward(attUser);
  assert(attRes.success && attRes.rewardAmount === 5.0 && attRes.currentDay === 1, 'Day 1 attendance claimed (₹5.00)');

  const attDup = db.claimAttendanceReward(attUser);
  assert(!attDup.success, 'Duplicate attendance claim on same day rejected');
}

async function main() {
  console.log('==============================================');
  console.log('   APEX ARCADE FULL TEST RUNNER (ALL PILLARS) ');
  console.log('==============================================');

  await runWalletTests();
  runWinGoEngineTests();
  runAviatorEngineTests();
  await runTurnoverAndAffiliateTests();
  await runOperatorWarRoomTests();

  console.log('\n==============================================');
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('==============================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
