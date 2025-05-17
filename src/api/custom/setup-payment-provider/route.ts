import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { PaymentProviderService } from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const paymentProviderService = req.scope.resolve("paymentProviderService") as PaymentProviderService;

    await paymentProviderService.registerInstalledProviders(["manual"]);

    return res.json({
      success: true,
      message: "Manual payment provider configured successfully"
    });
  } catch (error: any) {
    console.error("Error setting up payment provider:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to configure payment provider",
      error: error.message
    });
  }
};
