import {
  Cart,
  CustomerService,
  LineItem,
  OrderService as MedusaOrderService,
  Order,
} from "@medusajs/medusa";
import axios from "axios";
// import { generateTsimHeaders } from "src/util/preScript";
import { generateTsimHeaders } from "../util/preScript";


class OrderService extends MedusaOrderService {
  constructor(container) {
    super(container);
  }

  async updateOrderMetadata(orderId: string) {
    const order = await super.retrieve(orderId, {
      relations: [
        "items",
        "items.variant",
        "items.variant.product",
        "customer",
      ],
    });

    console.log("Order details:", order);
    console.log("Customer details:", order.customer);
    console.log("Product metadata:", order.items[0].variant.product.metadata);

    let packages = order.items.map((item: LineItem) => {
      return {
        quantity: item.quantity,
        package_id: item.variant.product.metadata.package_id,
        first_name: order.customer.first_name,
        last_name: order.customer.last_name,
        address: "digital delivery",
        country: "US",
        email: order.email,
        phone_number: order.customer.phone,
      };
    });

    try {
      const response = await Promise.all(
        packages.map(async (p: any) => {
          const headers = generateTsimHeaders();
          
          // Step 1: Create eSIM subscription
          const createdOrderResponse = await axios.post(
            `${process.env.API_URL}/tsim/v1/esimSubscribe`,
            p,
            { headers }
          );
          console.log("eSIM subscription response:", createdOrderResponse.data);

          const orderId = createdOrderResponse.data.order_id;

          // Step 2: Get order details
          const orderDetailsResponse = await axios.get(
            `${process.env.API_URL}/tsim/v1/esimOrderDetails`,
            {
              params: { order_id: orderId },
              headers
            }
          );
          console.log("Order details response:", orderDetailsResponse.data);

          // Step 3: Get QR code
          const qrCodeResponse = await axios.get(
            `${process.env.API_URL}/tsim/v1/esimQrCode`,
            {
              params: { order_id: orderId },
              headers
            }
          );
          console.log("QR code response:", qrCodeResponse.data);

          const combinedData = {
            data: {
              id: orderId,
              data: orderDetailsResponse.data.data.package_data,
              sims: [
                {
                  lpa: createdOrderResponse.data.sims[0].lpa_server,
                  iccid: createdOrderResponse.data.sims[0].iccid,
                  imsis: createdOrderResponse.data.sims[0].imsi_number,
                  qrcode: qrCodeResponse.data.qr_codes[0],
                  qrcode_url: qrCodeResponse.data.qr_codes[0],
                },
              ],
              price: orderDetailsResponse.data.data.amount,
              voice: orderDetailsResponse.data.data.voice,
              package: orderDetailsResponse.data.data.package_name,
              currency: orderDetailsResponse.data.data.currency,
              quantity: orderDetailsResponse.data.data.quantity,
              validity: orderDetailsResponse.data.data.validity,
              net_price: orderDetailsResponse.data.data.amount,
              created_at: order.created_at,
              package_id: p.package_id,
            },
            meta: {
              message: createdOrderResponse.data.status,
            },
          };

          console.log("Combined Data:", combinedData);
          return combinedData;
        })
      );

      const newMetadata = {
        ...order.metadata,
        orderData: response,
      };

      await super.update(order.id, { metadata: newMetadata });
      return;
    } catch (e) {
      console.error("Error in updateOrderMetadata:", e);
      throw new Error("Failed to update order metadata");
    }
  }

  async createFromCart(cartOrId: string | Cart): Promise<Order> {
    const order = await super.createFromCart(cartOrId);
    await this.updateOrderMetadata(order.id);
    return order;
  }
}

export default OrderService;
