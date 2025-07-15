import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyBanknoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with seed data
  await storage.seedInitialData();

  // Get all countries
  app.get("/api/countries", async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  // Get denominations for a country
  app.get("/api/countries/:countryCode/denominations", async (req, res) => {
    try {
      const { countryCode } = req.params;
      const country = await storage.getCountryByCode(countryCode);
      
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }

      const denominations = await storage.getDenominationsByCountry(country.id);
      res.json(denominations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch denominations" });
    }
  });

  // Verify banknote
  app.post("/api/verify", async (req, res) => {
    try {
      const { countryCode, denomination, serialNumber } = verifyBanknoteSchema.parse(req.body);
      
      const country = await storage.getCountryByCode(countryCode);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }

      const denominationData = await storage.getDenomination(country.id, denomination);
      if (!denominationData) {
        return res.status(404).json({ message: "Denomination not found" });
      }

      // Validate serial number format
      const serialRegex = new RegExp(denominationData.serialFormat);
      const formatValid = serialRegex.test(serialNumber);
      const lengthValid = serialNumber.length === denominationData.serialLength;
      
      // Determine if banknote is authentic based on format and length validation
      // In a real system, this would also check against a database of known authentic/counterfeit notes
      const isAuthentic = formatValid && lengthValid;

      // Log the verification
      await storage.createVerificationLog({
        countryId: country.id,
        denominationId: denominationData.id,
        serialNumber,
        isAuthentic,
        formatValid,
        lengthValid,
      });

      res.json({
        country: country.name,
        currency: country.currency,
        denomination: denominationData.displayName,
        serialNumber,
        formatValid,
        lengthValid,
        isAuthentic,
        patternDescription: denominationData.patternDescription,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Get verification statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getVerificationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
