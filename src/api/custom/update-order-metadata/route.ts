import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import OrderService from "src/services/order"; // Adjust the path based on your project structure

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Extract order_id from the request body
    const body: any  = req.body;
    const order_id = body.order_id;

    if (!order_id) {
      return res.status(400).json({ status: false, message: "Missing order_id" });
    }

    // Resolve OrderService
    const orderService: OrderService = req.scope.resolve("orderService") as OrderService;

    // Call function to process the order
    await orderService.updateOrderMetadata(order_id);

    return res.json({ status: true, message: "Order metadata updated successfully" });
  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
