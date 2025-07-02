/**
 * =============================================================================
 * STOCK DATABASE SEEDER
 * =============================================================================
 *
 * Seeds the database with 100 popular stock symbols for live data tracking.
 * This replaces the mock data previously stored in the StockService.
 *
 * Features:
 * - 100 popular US stocks across major sectors
 * - All stocks marked as non-favorite by default
 * - Proper entity structure for TypeORM
 * =============================================================================
 */

import { Stock } from '../../entities/stock.entity';

export const stockSeedData: Partial<Stock>[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    favorite: false,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    favorite: false,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    favorite: false,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    favorite: false,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    favorite: false,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    favorite: false,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    favorite: false,
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    favorite: false,
  },
  {
    symbol: 'CVNA',
    name: 'Carvana Co.',
    favorite: false,
  },
  {
    symbol: 'CMG',
    name: 'Chipotle Mexican Grill Inc.',
    favorite: false,
  },
  {
    symbol: 'DIS',
    name: 'The Walt Disney Company',
    favorite: false,
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    favorite: false,
  },
  {
    symbol: 'PYPL',
    name: 'PayPal Holdings Inc.',
    favorite: false,
  },
  {
    symbol: 'ADBE',
    name: 'Adobe Inc.',
    favorite: false,
  },
  {
    symbol: 'INTC',
    name: 'Intel Corporation',
    favorite: false,
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices Inc.',
    favorite: false,
  },
  {
    symbol: 'ORCL',
    name: 'Oracle Corporation',
    favorite: false,
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    favorite: false,
  },
  {
    symbol: 'HD',
    name: 'The Home Depot Inc.',
    favorite: false,
  },
  {
    symbol: 'PG',
    name: 'Procter & Gamble Co.',
    favorite: false,
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Company',
    favorite: false,
  },
  {
    symbol: 'PEP',
    name: 'PepsiCo Inc.',
    favorite: false,
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    favorite: false,
  },
  {
    symbol: 'MA',
    name: 'Mastercard Incorporated',
    favorite: false,
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Inc.',
    favorite: false,
  },
  {
    symbol: 'BAC',
    name: 'Bank of America Corp.',
    favorite: false,
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    favorite: false,
  },
  {
    symbol: 'CVX',
    name: 'Chevron Corporation',
    favorite: false,
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    favorite: false,
  },
  {
    symbol: 'ABBV',
    name: 'AbbVie Inc.',
    favorite: false,
  },
  {
    symbol: 'MRK',
    name: 'Merck & Co. Inc.',
    favorite: false,
  },
  {
    symbol: 'TMO',
    name: 'Thermo Fisher Scientific Inc.',
    favorite: false,
  },
  {
    symbol: 'ASML',
    name: 'ASML Holding N.V.',
    favorite: false,
  },
  {
    symbol: 'WFC',
    name: 'Wells Fargo & Company',
    favorite: false,
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    favorite: false,
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    favorite: false,
  },
  {
    symbol: 'NVO',
    name: 'Novo Nordisk A/S',
    favorite: false,
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corporation',
    favorite: false,
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    favorite: false,
  },
  {
    symbol: 'ACN',
    name: 'Accenture plc',
    favorite: false,
  },
  {
    symbol: 'NOW',
    name: 'ServiceNow Inc.',
    favorite: false,
  },
  {
    symbol: 'LOW',
    name: "Lowe's Companies Inc.",
    favorite: false,
  },
  {
    symbol: 'IBM',
    name: 'International Business Machines Corporation',
    favorite: false,
  },
  {
    symbol: 'TXN',
    name: 'Texas Instruments Incorporated',
    favorite: false,
  },
  {
    symbol: 'QCOM',
    name: 'QUALCOMM Incorporated',
    favorite: false,
  },
  {
    symbol: 'UPS',
    name: 'United Parcel Service Inc.',
    favorite: false,
  },
  {
    symbol: 'MDT',
    name: 'Medtronic plc',
    favorite: false,
  },
  {
    symbol: 'INTU',
    name: 'Intuit Inc.',
    favorite: false,
  },
  {
    symbol: 'CAT',
    name: 'Caterpillar Inc.',
    favorite: false,
  },
  {
    symbol: 'GS',
    name: 'The Goldman Sachs Group Inc.',
    favorite: false,
  },
  {
    symbol: 'ISRG',
    name: 'Intuitive Surgical Inc.',
    favorite: false,
  },
  {
    symbol: 'BKNG',
    name: 'Booking Holdings Inc.',
    favorite: false,
  },
  {
    symbol: 'BA',
    name: 'The Boeing Company',
    favorite: false,
  },
  {
    symbol: 'DE',
    name: 'Deere & Company',
    favorite: false,
  },
  {
    symbol: 'GE',
    name: 'General Electric Company',
    favorite: false,
  },
  {
    symbol: 'SPGI',
    name: 'S&P Global Inc.',
    favorite: false,
  },
  {
    symbol: 'AXP',
    name: 'American Express Company',
    favorite: false,
  },
  {
    symbol: 'BLK',
    name: 'BlackRock Inc.',
    favorite: false,
  },
  {
    symbol: 'MMM',
    name: '3M Company',
    favorite: false,
  },
  {
    symbol: 'SYK',
    name: 'Stryker Corporation',
    favorite: false,
  },
  {
    symbol: 'ADI',
    name: 'Analog Devices Inc.',
    favorite: false,
  },
  {
    symbol: 'GILD',
    name: 'Gilead Sciences Inc.',
    favorite: false,
  },
  {
    symbol: 'MDLZ',
    name: 'Mondelez International Inc.',
    favorite: false,
  },
  {
    symbol: 'C',
    name: 'Citigroup Inc.',
    favorite: false,
  },
  {
    symbol: 'CB',
    name: 'Chubb Limited',
    favorite: false,
  },
  {
    symbol: 'MO',
    name: 'Altria Group Inc.',
    favorite: false,
  },
  {
    symbol: 'AMT',
    name: 'American Tower Corporation',
    favorite: false,
  },
  {
    symbol: 'SO',
    name: 'The Southern Company',
    favorite: false,
  },
  {
    symbol: 'HON',
    name: 'Honeywell International Inc.',
    favorite: false,
  },
  {
    symbol: 'CCI',
    name: 'Crown Castle Inc.',
    favorite: false,
  },
  {
    symbol: 'NEE',
    name: 'NextEra Energy Inc.',
    favorite: false,
  },
  {
    symbol: 'TJX',
    name: 'The TJX Companies Inc.',
    favorite: false,
  },
  {
    symbol: 'MS',
    name: 'Morgan Stanley',
    favorite: false,
  },
  {
    symbol: 'REGN',
    name: 'Regeneron Pharmaceuticals Inc.',
    favorite: false,
  },
  {
    symbol: 'VRTX',
    name: 'Vertex Pharmaceuticals Incorporated',
    favorite: false,
  },
  {
    symbol: 'ZTS',
    name: 'Zoetis Inc.',
    favorite: false,
  },
  {
    symbol: 'BSX',
    name: 'Boston Scientific Corporation',
    favorite: false,
  },
  {
    symbol: 'SCHW',
    name: 'The Charles Schwab Corporation',
    favorite: false,
  },
  {
    symbol: 'MU',
    name: 'Micron Technology Inc.',
    favorite: false,
  },
  {
    symbol: 'ELV',
    name: 'Elevance Health Inc.',
    favorite: false,
  },
  {
    symbol: 'PLD',
    name: 'Prologis Inc.',
    favorite: false,
  },
  {
    symbol: 'LRCX',
    name: 'Lam Research Corporation',
    favorite: false,
  },
  {
    symbol: 'SHW',
    name: 'The Sherwin-Williams Company',
    favorite: false,
  },
  {
    symbol: 'BMY',
    name: 'Bristol-Myers Squibb Company',
    favorite: false,
  },
  {
    symbol: 'ETN',
    name: 'Eaton Corporation plc',
    favorite: false,
  },
  {
    symbol: 'CVS',
    name: 'CVS Health Corporation',
    favorite: false,
  },
  {
    symbol: 'EOG',
    name: 'EOG Resources Inc.',
    favorite: false,
  },
  {
    symbol: 'ICE',
    name: 'Intercontinental Exchange Inc.',
    favorite: false,
  },
  {
    symbol: 'FI',
    name: 'Fiserv Inc.',
    favorite: false,
  },
  {
    symbol: 'KLAC',
    name: 'KLA Corporation',
    favorite: false,
  },
  {
    symbol: 'APD',
    name: 'Air Products and Chemicals Inc.',
    favorite: false,
  },
  {
    symbol: 'MCO',
    name: "Moody's Corporation",
    favorite: false,
  },
  {
    symbol: 'DUK',
    name: 'Duke Energy Corporation',
    favorite: false,
  },
  {
    symbol: 'PGR',
    name: 'The Progressive Corporation',
    favorite: false,
  },
  {
    symbol: 'AON',
    name: 'Aon plc',
    favorite: false,
  },
  {
    symbol: 'CL',
    name: 'Colgate-Palmolive Company',
    favorite: false,
  },
  {
    symbol: 'TFC',
    name: 'Truist Financial Corporation',
    favorite: false,
  },
  {
    symbol: 'EMR',
    name: 'Emerson Electric Co.',
    favorite: false,
  },
  {
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    favorite: false,
  },
  {
    symbol: 'SQ',
    name: 'Block Inc.',
    favorite: false,
  },
];
