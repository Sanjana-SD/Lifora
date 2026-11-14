import {
  detectChannel,
  extractCounterparty,
  extractReference,
  findMoney,
  parseStatementDate,
  parseStatementText,
} from '@/utils/statementParser';

const NOW = new Date(2026, 10, 14);
const parse = (text: string) => parseStatementText(text, NOW);
const brief = (text: string) =>
  parse(text).rows.map((r) => [r.date, r.counterparty, r.type, r.amountPaise, r.channel]);

// Text as PDFBox extracts it (sorted by position), in each bank's layout.
const SBI = `STATE BANK OF INDIA
Account Statement from 1 Nov 2026 to 13 Nov 2026
Txn Date Value Date Description Ref No./Cheque No. Debit Credit Balance
Balance as on 1 Nov 2026 : 25,000.00
1 Nov 2026 1 Nov 2026 TO TRANSFER-UPI/DR/430512345678/SWIGGY/YESB/swiggy@yesb/Payment- TRANSFER TO 4897691162093 450.00 24,550.00
3 Nov 2026 3 Nov 2026 BY TRANSFER-NEFT*HDFC0000001*N123456789*ACME TECHNOLOGIES PVT LTD- TRANSFER FROM 3199 50,000.00 74,550.00
5 Nov 2026 5 Nov 2026 ATM WDL-ATM CASH 1234 MG ROAD BANGALORE 2,000.00 72,550.00
Page 1 of 1`;

const HDFC = `HDFC BANK Ltd.
Statement of account
Date Narration Chq./Ref.No. Value Dt Withdrawal Amt. Deposit Amt. Closing Balance
01/11/26 UPI-ZOMATO LTD-zomato@hdfcbank-HDFC0MERUPI- 0000430598765432 01/11/26 389.00 12,611.00
430598765432-Order payment
02/11/26 UPI-RAVI KUMAR-ravikumar@okaxis-UTIB0000123 0000430611112222 02/11/26 1,500.00 14,111.00
-430611112222-Rent share
04/11/26 POS 416021XXXXXX1234 AMAZON PAY INDIA 0000000000000000 04/11/26 2,499.00 11,612.00
Page 1 of 2
STATEMENT SUMMARY
Opening Balance Dr Count Cr Count Debits Credits Closing Bal
13,000.00 2 1 2,888.00 1,500.00 11,612.00`;

const ICICI = `ICICI Bank Limited
S No. Value Date Transaction Date Cheque Number Transaction Remarks Withdrawal Amount (INR ) Deposit Amount (INR ) Balance (INR )
1 01/11/2026 01/11/2026 - UPI/430712345678/Uber India/uber.rides@hdfcbank/Payment 218.50 0.00 9,781.50
2 03/11/2026 03/11/2026 - NEFT-ICIC00012345-SALARY NOVEMBER-ACME 0.00 85,000.00 94,781.50
3 05/11/2026 05/11/2026 - UPI/430799998888/BigBasket/bigbasket@icici/Groceries 1,245.75 0.00 93,535.75`;

const KOTAK = `Kotak Mahindra Bank
Date Narration Chq/Ref No Withdrawal (Dr) / Deposit (Cr) Balance
06-11-2026 UPI/NETFLIX/431012345678/Netflix Subscription UPI-431012345678 649.00(Dr) 8,500.00(Cr)
07-11-2026 Int.Pd:01-08-2026 to 31-10-2026 45.00(Cr) 8,545.00(Cr)`;

// Newest first, with signed amounts.
const AXIS_DESC = `Axis Bank
Tran Date Particulars Amount Balance
12-11-2026 UPI/P2M/431212121212/Jio Prepaid/Recharge -299.00 4,701.00
10-11-2026 IMPS/P2A/431010101010/PRIYA SHARMA/Gift +1,000.00 5,000.00
09-11-2026 Opening balance 4,000.00`;

describe('parseStatementDate', () => {
  it.each([
    ['01/11/2026', new Date(2026, 10, 1)],
    ['1-11-26', new Date(2026, 10, 1)],
    ['01.11.2026', new Date(2026, 10, 1)],
    ['1 Nov 2026', new Date(2026, 10, 1)],
    ['01-Nov-26', new Date(2026, 10, 1)],
    ['1 November, 2026', new Date(2026, 10, 1)],
    ['2026-11-01', new Date(2026, 10, 1)],
  ])('%s', (token, expected) => {
    expect(parseStatementDate(token)).toEqual(expected);
  });

  it('reads day-first and rejects impossible dates', () => {
    expect(parseStatementDate('05/11/2026')?.getMonth()).toBe(10);
    expect(parseStatementDate('31/02/2026')).toBeNull();
    expect(parseStatementDate('13/13/2026')).toBeNull();
  });
});

describe('findMoney', () => {
  it('reads Indian grouping, markers, and signs, and ignores non-money numbers', () => {
    expect(findMoney('1,23,456.78 Cr 450.00(Dr) -299.00 +10.00 01/11/26 430512345678 12.5').map((m) => [m.paise, m.marker])).toEqual([
      [12345678, 'income'],
      [45000, 'expense'],
      [29900, 'expense'],
      [1000, 'income'],
    ]);
  });
});

describe('narration helpers', () => {
  it.each([
    ['TO TRANSFER-UPI/DR/430512345678/SWIGGY/YESB/swiggy@yesb/Payment-', 'Swiggy'],
    ['UPI-ZOMATO LTD-zomato@hdfcbank-HDFC0MERUPI- 0000430598765432 430598765432-Order payment', 'Zomato Ltd'],
    ['UPI-RAVI KUMAR-ravikumar@okaxis-UTIB0000123 0000430611112222', 'Ravi Kumar'],
    ['POS 416021XXXXXX1234 AMAZON PAY INDIA 0000000000000000', 'Amazon Pay India'],
    ['NEFT-ICIC00012345-SALARY NOVEMBER-ACME', 'Salary November'],
    ['ATM WDL-ATM CASH 1234 MG ROAD', 'ATM withdrawal'],
    ['Int.Pd:01-08-2026 to 31-10-2026', 'Interest'],
  ])('%s → %s', (narration, name) => {
    expect(extractCounterparty(narration, detectChannel(narration))).toBe(name);
  });

  it('finds the UPI reference and the channel', () => {
    expect(extractReference('UPI-ZOMATO-0000430598765432 430598765432-Order')).toBe('430598765432');
    expect(extractReference('Cash deposit')).toBeNull();
    expect(detectChannel('NEFT*HDFC0000001*N123')).toBe('NEFT');
    expect(detectChannel('POS 4160 AMAZON')).toBe('Card');
  });
});

describe('parseStatementText', () => {
  it('SBI: uses the opening balance and running balance for direction', () => {
    const s = parse(SBI);
    expect(s.bankName).toBe('State Bank of India');
    expect(s.openingBalancePaise).toBe(2500000);
    expect(brief(SBI)).toEqual([
      ['2026-11-01', 'Swiggy', 'expense', 45000, 'UPI'],
      ['2026-11-03', 'Acme Technologies Pvt Ltd', 'income', 5000000, 'NEFT'],
      ['2026-11-05', 'ATM withdrawal', 'expense', 200000, 'ATM'],
    ]);
    expect([s.periodFrom, s.periodTo]).toEqual(['2026-11-01', '2026-11-05']);
  });

  it('HDFC: joins wrapped narration lines and finds the opening balance in the summary', () => {
    const s = parse(HDFC);
    expect(s.bankName).toBe('HDFC Bank');
    expect(s.openingBalancePaise).toBe(1300000);
    expect(brief(HDFC)).toEqual([
      ['2026-11-01', 'Zomato Ltd', 'expense', 38900, 'UPI'],
      ['2026-11-02', 'Ravi Kumar', 'income', 150000, 'UPI'],
      ['2026-11-04', 'Amazon Pay India', 'expense', 249900, 'Card'],
    ]);
    expect(s.rows[1].narration).toContain('Rent share');
    expect(s.rows[0].reference).toBe('430598765432');
  });

  it('ICICI: handles serial numbers and separate withdrawal/deposit columns', () => {
    expect(brief(ICICI)).toEqual([
      ['2026-11-01', 'Uber India', 'expense', 21850, 'UPI'],
      ['2026-11-03', 'Salary November', 'income', 8500000, 'NEFT'],
      ['2026-11-05', 'Bigbasket', 'expense', 124575, 'UPI'],
    ]);
  });

  it('Kotak: reads (Dr)/(Cr) markers and ignores the balance marker', () => {
    expect(brief(KOTAK)).toEqual([
      ['2026-11-06', 'Netflix', 'expense', 64900, 'UPI'],
      ['2026-11-07', 'Interest', 'income', 4500, 'Interest'],
    ]);
  });

  it('Axis: newest-first statements come out oldest-first, with signed amounts', () => {
    const s = parse(AXIS_DESC);
    expect(s.openingBalancePaise).toBe(400000);
    expect(brief(AXIS_DESC)).toEqual([
      ['2026-11-10', 'Priya Sharma', 'income', 100000, 'IMPS'],
      ['2026-11-12', 'Jio Prepaid', 'expense', 29900, 'UPI'],
    ]);
  });

  it('flags rows it cannot classify instead of guessing (PRD 4.C)', () => {
    const s = parse(`Some Bank
01/11/2026 Misc entry 500.00 9,500.00`);
    expect(s.rows).toHaveLength(1);
    expect(s.rows[0].type).toBeNull();
    expect(s.rows[0].reviewReason).toMatch(/money in or out/);
  });

  it('flags future-dated rows for review', () => {
    const s = parse(`01/12/2026 UPI/DR/1/SHOP/x@y 100.00 Dr 900.00`);
    expect(s.rows[0].reviewReason).toMatch(/future/);
  });

  it('returns nothing for text that is not a statement', () => {
    expect(parse('Hello world\nNo transactions here').rows).toEqual([]);
    expect(parse('').rows).toEqual([]);
  });

  it('keeps amounts exact in paise', () => {
    const s = parse(`Opening Balance 0.01
01/11/2026 UPI/CR/1/A/a@b 99.99 100.00`);
    expect(s.rows[0]).toMatchObject({ amountPaise: 9999, type: 'income', balancePaise: 10000 });
  });
});
