import {
    MedusaRequest,
    MedusaResponse,
    Logger,
    ProductCollection,
    ProductService,
    ProductStatus,
  } from "@medusajs/medusa";
  import ProductCollectionRepository from "@medusajs/medusa/dist/repositories/product-collection";
  import SalesChannelRepository from "@medusajs/medusa/dist/repositories/sales-channel";
  import axios from "axios";
// import { generateTsimHeaders } from "src/util/preScript";
import { generateTsimHeaders } from "../../../util/preScript";

  import { uuid } from "uuidv4";
  
  interface TSimPackage {
    channel_dataplan_id: string;
    channel_dataplan_name: string;
    price: string;
    currency: string;
    status: string;
    remark: string;
    day: number;
    apn: string;
    coverages: string[];
    data_allowance?: number;
    day_data_allowance?: number;
    is_daily?: boolean;
  }

  interface TSimResponse {
    result: TSimPackage[];
  }

  const countryListFetcher = async () => {
    try {
      let res = await axios.get(`${process.env.API_URL_V2}/Countries-List`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("res is ", res.data);
      return res.data;
    } catch (e) {
      console.log("error is ", e);
      throw new Error("Error in fetching countries data");
    }
  };
  
  const packagesDataFetcher = async () => {
    try {
      const headers = generateTsimHeaders();
      const res = await axios.get(`${process.env.API_URL}/tsim/v1/esimDataplanList`, {
        headers: {
          ...headers,
        },
      });
      console.log("TSim API Response:", res.data);
      return res.data;
    } catch (e) {
      console.error("Error fetching packages:", e);
      throw new Error("Error in fetching packages data");
    }
  };
  
  const collectionCreationHandler = async (packageData: TSimPackage) => {
    try {
      const collectionId = packageData.channel_dataplan_id;
      if (await ProductCollectionRepository.findOne({ where: { id: collectionId } })) {
        return;
      }

      const parsedCollectionData = {
        id: collectionId,
        title: packageData.channel_dataplan_name,
        handle: packageData.coverages[0] || "default",
        metadata: {
          country_code: packageData.coverages[0] || "default",
          currency: packageData.currency,
        },
      };

      return await ProductCollectionRepository.save([parsedCollectionData]);
    } catch (e) {
      console.error("Error creating collection:", e);
      throw new Error("Error in creating collection");
    }
  };
  
  const productCreationHandler = async (
    packageData: TSimPackage,
    req: MedusaRequest
  ) => {
    try {
      const productService: ProductService = req.scope.resolve("productService") as ProductService;
      const salesChannel = await SalesChannelRepository.findOne({
        where: { name: "Default Sales Channel" },
      });

      if (!salesChannel) {
        throw new Error("Default sales channel not found");
      }

      const existingProduct = await productService.list({
        metadata: { package_id: packageData.channel_dataplan_id },
      });

      if (existingProduct.length > 0) {
        return;
      }

      return await productService.create({
        title: packageData.channel_dataplan_name,
        handle: uuid(),
        metadata: {
          package_id: packageData.channel_dataplan_id,
          data_allowance: packageData.data_allowance,
          day_data_allowance: packageData.day_data_allowance,
          is_daily: packageData.is_daily,
        },
        description: packageData.remark || packageData.channel_dataplan_name,
        collection_id: packageData.channel_dataplan_id,
        options: [{ title: "Type" }],
        status: ProductStatus.PUBLISHED,
        sales_channels: [{ id: salesChannel.id }],
        thumbnail: "",
        variants: [
          {
            title: packageData.channel_dataplan_name,
            prices: [
              {
                amount: Math.round(parseFloat(packageData.price) * 100),
                currency_code: packageData.currency.toLowerCase(),
              },
            ],
            options: [{ value: "Type" }],
            metadata: {
              day: packageData.day,
              apn: packageData.apn,
              status: packageData.status,
              coverages: packageData.coverages,
            },
            inventory_quantity: 100,
            manage_inventory: false,
          },
        ],
      });
    } catch (e) {
      console.error("Error in productCreationHandler:", e);
      throw new Error("Error in creating products");
    }
  };
  
  export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const logger = req.scope.resolve("logger") as Logger;
    try {
      const tsimData = await packagesDataFetcher();
      
      if (!tsimData || !tsimData.result || !Array.isArray(tsimData.result)) {
        throw new Error("Invalid response format from TSim API");
      }

      for (const packageData of tsimData.result) {
        try {
          await collectionCreationHandler(packageData);
          await productCreationHandler(packageData, req);
        } catch (e) {
          console.error(`Error processing package ${packageData.channel_dataplan_id}:`, e);
          continue;
        }
      }

      return res.send({
        status: true,
        message: "Products imported successfully",
      });
    } catch (e) {
      console.error("Error in GET handler:", e);
      return res.send({ status: false, message: e.message });
    }
  };
  