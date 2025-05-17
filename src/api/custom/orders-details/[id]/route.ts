import { Logger, MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { OrderService } from "@medusajs/medusa";
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  let orderId = req.params.id;
  console.log("retrieving order details for order id ", orderId);
  try {
    const orderService: OrderService = req.scope.resolve("orderService");
    const order = await orderService.retrieve(orderId, {
      select: [
        "metadata",
        "items",
        "customer",
        "payments",
        "region",
        "discounts",
      ],
      relations: ["items", "customer"],
    });
    console.log("order is ", order);
    return res.send({ status: true, data: order });
  } catch (err) {
    console.log(err);
    return res.send({ status: false, message: err.message });
  }
};
