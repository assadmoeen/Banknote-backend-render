import { pgTable, text, serial, integer, boolean, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: text("name").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  currencySymbol: varchar("currency_symbol", { length: 5 }).notNull(),
});

export const denominations = pgTable("denominations", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull(),
  value: text("value").notNull(),
  displayName: text("display_name").notNull(),
  serialFormat: text("serial_format").notNull(),
  serialLength: integer("serial_length").notNull(),
  patternDescription: text("pattern_description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const verificationLogs = pgTable("verification_logs", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull(),
  denominationId: integer("denomination_id").notNull(),
  serialNumber: text("serial_number").notNull(),
  isAuthentic: boolean("is_authentic").notNull(),
  formatValid: boolean("format_valid").notNull(),
  lengthValid: boolean("length_valid").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  denominations: many(denominations),
  verificationLogs: many(verificationLogs),
}));

export const denominationsRelations = relations(denominations, ({ one, many }) => ({
  country: one(countries, {
    fields: [denominations.countryId],
    references: [countries.id],
  }),
  verificationLogs: many(verificationLogs),
}));

export const verificationLogsRelations = relations(verificationLogs, ({ one }) => ({
  country: one(countries, {
    fields: [verificationLogs.countryId],
    references: [countries.id],
  }),
  denomination: one(denominations, {
    fields: [verificationLogs.denominationId],
    references: [denominations.id],
  }),
}));

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
});

export const insertDenominationSchema = createInsertSchema(denominations).omit({
  id: true,
});

export const insertVerificationLogSchema = createInsertSchema(verificationLogs).omit({
  id: true,
  timestamp: true,
});

export const verifyBanknoteSchema = z.object({
  countryCode: z.string().min(2).max(3),
  denomination: z.string().min(1),
  serialNumber: z.string().min(1).max(20),
});

export type Country = typeof countries.$inferSelect;
export type Denomination = typeof denominations.$inferSelect;
export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type InsertDenomination = z.infer<typeof insertDenominationSchema>;
export type InsertVerificationLog = z.infer<typeof insertVerificationLogSchema>;
export type VerifyBanknoteRequest = z.infer<typeof verifyBanknoteSchema>;
