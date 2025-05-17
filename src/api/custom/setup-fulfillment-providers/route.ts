import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";
import FulfillmentProviderService from "@medusajs/medusa/dist/services/fulfillment-provider";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger") as Logger;
  const fulfillmentProviderService = req.scope.resolve("fulfillmentProviderService") as FulfillmentProviderService;

  try {
    // Register and enable fulfillment providers
    await fulfillmentProviderService.registerInstalledProviders(["manual"]);
    
    // Get all installed fulfillment providers
    const fulfillmentProviders = await fulfillmentProviderService.list();
    logger.info(`Available fulfillment providers: ${fulfillmentProviders.map(p => p.id).join(", ")}`);

    return res.json({
      success: true,
      message: "Successfully set up fulfillment providers",
      providers: fulfillmentProviders.map(p => p.id)
    });
  } catch (error) {
    logger.error("Error in fulfillment provider setup:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up fulfillment providers",
      error: error.message
    });
  }
}; 