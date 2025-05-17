import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";
import { Currency } from "@medusajs/medusa"; // import the Currency entity
import { Repository } from "typeorm"; // import Repository from typeorm

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger") as Logger;
  const currencyRepository = req.scope.resolve("currencyRepository") as Repository<Currency>; // <- Type it properly

  try {
    // Define currencies to create
    const currencies = [
      { code: "CNY", symbol: "¥", symbol_native: "¥", name: "Chinese Yuan" },
      { code: "USD", symbol: "$", symbol_native: "$", name: "US Dollar" },
      { code: "EUR", symbol: "€", symbol_native: "€", name: "Euro" },
      { code: "AUD", symbol: "A$", symbol_native: "$", name: "Australian Dollar" },
      { code: "ZAR", symbol: "R", symbol_native: "R", name: "South African Rand" },
      { code: "BRL", symbol: "R$", symbol_native: "R$", name: "Brazilian Real" }
    ];

    let createdCurrencies = 0;
    let errors: string[] = [];

    for (const currency of currencies) {
      try {
        const existingCurrency = await currencyRepository.findOne({
          where: { code: currency.code }
        });

        if (existingCurrency) {
          logger.info(`Currency ${currency.code} already exists, skipping...`);
          continue;
        }

        const newCurrency = currencyRepository.create(currency);
        await currencyRepository.save(newCurrency);

        createdCurrencies++;
        logger.info(`Created currency: ${currency.code}`);
      } catch (error: any) {
        logger.error(`Error creating currency ${currency.code}:`, error);
        errors.push(`Error creating currency ${currency.code}: ${error.message}`);
      }
    }

    return res.json({
      success: true,
      message: `Successfully created ${createdCurrencies} currencies`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error("Error in currency setup:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up currencies",
      error: error.message
    });
  }
};