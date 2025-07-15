import { 
  countries, 
  denominations, 
  verificationLogs,
  type Country, 
  type Denomination, 
  type VerificationLog,
  type InsertCountry,
  type InsertDenomination,
  type InsertVerificationLog 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Countries
  getCountries(): Promise<Country[]>;
  getCountryByCode(code: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  
  // Denominations
  getDenominationsByCountry(countryId: number): Promise<Denomination[]>;
  getDenomination(countryId: number, value: string): Promise<Denomination | undefined>;
  createDenomination(denomination: InsertDenomination): Promise<Denomination>;
  
  // Verification Logs
  createVerificationLog(log: InsertVerificationLog): Promise<VerificationLog>;
  getVerificationStats(): Promise<{
    totalVerified: number;
    authentic: number;
    suspicious: number;
    successRate: number;
  }>;
  
  // Seed initial data
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.code, code));
    return country || undefined;
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    const [country] = await db
      .insert(countries)
      .values(insertCountry)
      .returning();
    return country;
  }

  async getDenominationsByCountry(countryId: number): Promise<Denomination[]> {
    return await db.select().from(denominations).where(eq(denominations.countryId, countryId));
  }

  async getDenomination(countryId: number, value: string): Promise<Denomination | undefined> {
    const [denomination] = await db
      .select()
      .from(denominations)
      .where(and(eq(denominations.countryId, countryId), eq(denominations.value, value)));
    return denomination || undefined;
  }

  async createDenomination(insertDenomination: InsertDenomination): Promise<Denomination> {
    const [denomination] = await db
      .insert(denominations)
      .values(insertDenomination)
      .returning();
    return denomination;
  }

  async createVerificationLog(insertLog: InsertVerificationLog): Promise<VerificationLog> {
    const [log] = await db
      .insert(verificationLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getVerificationStats(): Promise<{
    totalVerified: number;
    authentic: number;
    suspicious: number;
    successRate: number;
  }> {
    const logs = await db.select().from(verificationLogs);
    const totalVerified = logs.length;
    const authentic = logs.filter(log => log.isAuthentic).length;
    const suspicious = totalVerified - authentic;
    const successRate = totalVerified > 0 ? (authentic / totalVerified) * 100 : 0;
    
    return {
      totalVerified,
      authentic,
      suspicious,
      successRate: Math.round(successRate * 10) / 10,
    };
  }

  async seedInitialData(): Promise<void> {
    // Check if data already exists
    const existingCountries = await this.getCountries();
    if (existingCountries.length > 0) {
      return; // Data already seeded
    }

    // Seed countries with correct abbreviations
    const countryData = [
      { code: "US", name: "United States", currency: "USD", currencySymbol: "$" },
      { code: "UK", name: "United Kingdom", currency: "GBP", currencySymbol: "£" },
      { code: "EU", name: "European Union", currency: "EUR", currencySymbol: "€" },
      { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥" },
      { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$" },
      { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$" },
      { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "CHF" },
      { code: "CN", name: "China", currency: "CNY", currencySymbol: "¥" },
      { code: "IN", name: "India", currency: "INR", currencySymbol: "₹" },
      { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "₩" },
      { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "S$" },
      { code: "HK", name: "Hong Kong", currency: "HKD", currencySymbol: "HK$" },
      { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr" },
      { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr" },
      { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr" },
      { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "NZ$" },
      { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "₽" },
      { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$" },
      { code: "MX", name: "Mexico", currency: "MXN", currencySymbol: "$" },
      { code: "SA", name: "South Africa", currency: "ZAR", currencySymbol: "R" },
      { code: "LK", name: "Sri Lanka", currency: "LKR", currencySymbol: "Rs" },
      { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM" },
      { code: "TH", name: "Thailand", currency: "THB", currencySymbol: "฿" },
      { code: "ID", name: "Indonesia", currency: "IDR", currencySymbol: "Rp" },
      { code: "PH", name: "Philippines", currency: "PHP", currencySymbol: "₱" },
    ];

    const createdCountries = await Promise.all(
      countryData.map(country => this.createCountry(country))
    );

    // Seed denominations with comprehensive banknote data
    const denominationData = [
      // US Dollar
      { countryId: createdCountries[0].id, value: "1", displayName: "$1", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "2", displayName: "$2", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "5", displayName: "$5", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "10", displayName: "$10", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "20", displayName: "$20", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "50", displayName: "$50", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      { countryId: createdCountries[0].id, value: "100", displayName: "$100", serialFormat: "^[A-L]\\d{8}[A-Z]$", serialLength: 10, patternDescription: "Letter + 8 digits + Letter" },
      
      // UK Pound - Fixed format based on real Bank of England notes
      { countryId: createdCountries[1].id, value: "5", displayName: "£5", serialFormat: "^[A-Z]{2}\\d{2}\\s\\d{6}$", serialLength: 11, patternDescription: "2 Letters + 2 digits + space + 6 digits" },
      { countryId: createdCountries[1].id, value: "10", displayName: "£10", serialFormat: "^[A-Z]{2}\\d{2}\\s\\d{6}$", serialLength: 11, patternDescription: "2 Letters + 2 digits + space + 6 digits" },
      { countryId: createdCountries[1].id, value: "20", displayName: "£20", serialFormat: "^[A-Z]{2}\\d{2}\\s\\d{6}$", serialLength: 11, patternDescription: "2 Letters + 2 digits + space + 6 digits" },
      { countryId: createdCountries[1].id, value: "50", displayName: "£50", serialFormat: "^[A-Z]{2}\\d{2}\\s\\d{6}$", serialLength: 11, patternDescription: "2 Letters + 2 digits + space + 6 digits" },
      
      // Euro
      { countryId: createdCountries[2].id, value: "5", displayName: "€5", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "10", displayName: "€10", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "20", displayName: "€20", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "50", displayName: "€50", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "100", displayName: "€100", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "200", displayName: "€200", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      { countryId: createdCountries[2].id, value: "500", displayName: "€500", serialFormat: "^[A-Z]\\d{11}$", serialLength: 12, patternDescription: "Letter + 11 digits" },
      
      // Japanese Yen
      { countryId: createdCountries[3].id, value: "1000", displayName: "¥1000", serialFormat: "^[A-Z]\\d{6}[A-Z]$", serialLength: 8, patternDescription: "Letter + 6 digits + Letter" },
      { countryId: createdCountries[3].id, value: "2000", displayName: "¥2000", serialFormat: "^[A-Z]\\d{6}[A-Z]$", serialLength: 8, patternDescription: "Letter + 6 digits + Letter" },
      { countryId: createdCountries[3].id, value: "5000", displayName: "¥5000", serialFormat: "^[A-Z]\\d{6}[A-Z]$", serialLength: 8, patternDescription: "Letter + 6 digits + Letter" },
      { countryId: createdCountries[3].id, value: "10000", displayName: "¥10000", serialFormat: "^[A-Z]\\d{6}[A-Z]$", serialLength: 8, patternDescription: "Letter + 6 digits + Letter" },
      
      // Canadian Dollar
      { countryId: createdCountries[4].id, value: "5", displayName: "C$5", serialFormat: "^[A-Z]{3}\\d{7}$", serialLength: 10, patternDescription: "3 Letters + 7 digits" },
      { countryId: createdCountries[4].id, value: "10", displayName: "C$10", serialFormat: "^[A-Z]{3}\\d{7}$", serialLength: 10, patternDescription: "3 Letters + 7 digits" },
      { countryId: createdCountries[4].id, value: "20", displayName: "C$20", serialFormat: "^[A-Z]{3}\\d{7}$", serialLength: 10, patternDescription: "3 Letters + 7 digits" },
      { countryId: createdCountries[4].id, value: "50", displayName: "C$50", serialFormat: "^[A-Z]{3}\\d{7}$", serialLength: 10, patternDescription: "3 Letters + 7 digits" },
      { countryId: createdCountries[4].id, value: "100", displayName: "C$100", serialFormat: "^[A-Z]{3}\\d{7}$", serialLength: 10, patternDescription: "3 Letters + 7 digits" },
      
      // Australian Dollar
      { countryId: createdCountries[5].id, value: "5", displayName: "A$5", serialFormat: "^[A-Z]{2}\\d{8}$", serialLength: 10, patternDescription: "2 Letters + 8 digits" },
      { countryId: createdCountries[5].id, value: "10", displayName: "A$10", serialFormat: "^[A-Z]{2}\\d{8}$", serialLength: 10, patternDescription: "2 Letters + 8 digits" },
      { countryId: createdCountries[5].id, value: "20", displayName: "A$20", serialFormat: "^[A-Z]{2}\\d{8}$", serialLength: 10, patternDescription: "2 Letters + 8 digits" },
      { countryId: createdCountries[5].id, value: "50", displayName: "A$50", serialFormat: "^[A-Z]{2}\\d{8}$", serialLength: 10, patternDescription: "2 Letters + 8 digits" },
      { countryId: createdCountries[5].id, value: "100", displayName: "A$100", serialFormat: "^[A-Z]{2}\\d{8}$", serialLength: 10, patternDescription: "2 Letters + 8 digits" },
      
      // Swiss Franc
      { countryId: createdCountries[6].id, value: "10", displayName: "CHF 10", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      { countryId: createdCountries[6].id, value: "20", displayName: "CHF 20", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      { countryId: createdCountries[6].id, value: "50", displayName: "CHF 50", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      { countryId: createdCountries[6].id, value: "100", displayName: "CHF 100", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      { countryId: createdCountries[6].id, value: "200", displayName: "CHF 200", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      { countryId: createdCountries[6].id, value: "1000", displayName: "CHF 1000", serialFormat: "^\\d{2}[A-Z]\\d{7}$", serialLength: 10, patternDescription: "2 digits + Letter + 7 digits" },
      
      // South African Rand
      { countryId: createdCountries[19].id, value: "10", displayName: "R10", serialFormat: "^[A-Z]{2}\\d{7}$", serialLength: 9, patternDescription: "2 Letters + 7 digits" },
      { countryId: createdCountries[19].id, value: "20", displayName: "R20", serialFormat: "^[A-Z]{2}\\d{7}$", serialLength: 9, patternDescription: "2 Letters + 7 digits" },
      { countryId: createdCountries[19].id, value: "50", displayName: "R50", serialFormat: "^[A-Z]{2}\\d{7}$", serialLength: 9, patternDescription: "2 Letters + 7 digits" },
      { countryId: createdCountries[19].id, value: "100", displayName: "R100", serialFormat: "^[A-Z]{2}\\d{7}$", serialLength: 9, patternDescription: "2 Letters + 7 digits" },
      { countryId: createdCountries[19].id, value: "200", displayName: "R200", serialFormat: "^[A-Z]{2}\\d{7}$", serialLength: 9, patternDescription: "2 Letters + 7 digits" },
      
      // Sri Lankan Rupee
      { countryId: createdCountries[20].id, value: "20", displayName: "Rs 20", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
      { countryId: createdCountries[20].id, value: "50", displayName: "Rs 50", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
      { countryId: createdCountries[20].id, value: "100", displayName: "Rs 100", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
      { countryId: createdCountries[20].id, value: "500", displayName: "Rs 500", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
      { countryId: createdCountries[20].id, value: "1000", displayName: "Rs 1000", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
      { countryId: createdCountries[20].id, value: "5000", displayName: "Rs 5000", serialFormat: "^[A-Z]\\d{6}$", serialLength: 7, patternDescription: "Letter + 6 digits" },
    ];

    await Promise.all(
      denominationData.map(denomination => this.createDenomination(denomination))
    );
  }
}

export const storage = new DatabaseStorage();
