import {
  MedusaRequest,
  MedusaResponse,
  Logger,
  ProductCollection,
  ProductService,
  ProductStatus,
  SalesChannelService,
} from "@medusajs/medusa";
import ProductCollectionRepository from "@medusajs/medusa/dist/repositories/product-collection";
import SalesChannelRepository from "@medusajs/medusa/dist/repositories/sales-channel";
import axios from "axios";
import { generateTsimHeaders } from "../../../util/preScript";
import { v4 as uuidv4 } from 'uuid';
import { In } from "typeorm";
import { RegionRepository } from "@medusajs/medusa/dist/repositories/region";
import ProductCollectionService from "@medusajs/medusa/dist/services/product-collection";
import { MedusaContainer } from "@medusajs/types"; 
interface EsimPackage {
  id: string;
  type: string;
  price: string;
  amount: number;
  day: number;
  is_unlimited: boolean;
  title: string;
  data: string;
  short_info: string | null;
  qr_installation: string;
  manual_installation: string;
  voice: string | null;
  text: string | null;
  net_price: number;
  currency: string;
}

interface Coverage {
  name: string;
  networks: Array<{
    name: string;
    types: string[];
  }>;
}

interface APN {
  ios: {
    apn_type: string;
    apn_value: string | null;
  };
  android: {
    apn_type: string;
    apn_value: string | null;
  };
}

interface Operator {
  id: number;
  style: string;
  gradient_start: string;
  gradient_end: string;
  type: string;
  is_prepaid: boolean;
  title: string;
  esim_type: string;
  warning: string | null;
  apn_type: string;
  apn_value: string | null;
  is_roaming: boolean;
  info: string[];
  image: {
    width: number;
    height: number;
    url: string;
  };
  plan_type: string;
  activation_policy: string;
  is_kyc_verify: boolean;
  rechargeability: boolean;
  other_info: string;
  coverages: Coverage[];
  apn: APN;
  packages: EsimPackage[];
  countries: Array<{
    country_code: string;
    title: string;
    image: {
      width: number;
      height: number;
      url: string;
    };
  }>;
}

interface Package {
  slug: string;
  country_code: string;
  title: string;
  image: {
    width: number;
    height: number;
    url: string;
  };
  coverages: string[];
  apn: string;
  data_allowance?: number;
  operators: Operator[];
  currency: string;
  day_data_allowance?: number;
  is_daily?: boolean;
  remark: string;
  day: number;
  price: string;
  channel_dataplan_id: string;
  channel_dataplan_name: string;
}

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

interface Region {
  id: string;
  metadata?: {
    country_codes?: string[];
    coverage_codes?: string[];
  };
}

const transformToEsimPackage = (tsimPackage: TSimPackage): EsimPackage => {
  return {
    id: tsimPackage.channel_dataplan_id,
    type: "eSIM",
    price: parseFloat(tsimPackage.price).toString(),
    amount: 0,
    day: tsimPackage.day,
    is_unlimited: false,
    title: tsimPackage.channel_dataplan_name,
    data: "0",
    short_info: tsimPackage.remark || null,
    qr_installation: "",
    manual_installation: "",
    voice: null,
    text: null,
    net_price: parseFloat(tsimPackage.price),
    currency: tsimPackage.currency
  };
};

const packagesDataFetcher = async () => {
  try {
    const headers = generateTsimHeaders();
    const res = await axios.get(`${process.env.API_URL}/tsim/v1/dataplanList`, {
      headers: {
        ...headers,
        Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}`,
      },
    });

    return res.data;
  } catch (e) {
    throw new Error("Error in fetching packages data");
  }
};

const collectionCreationHandler = async (packages: TSimPackage[], container: MedusaContainer) => {
  try {
    const productCollectionService = container.resolve<ProductCollectionService>("productCollectionService");
    const logger = container.resolve("logger") as Logger;
    const createdCollections = [];

    const regions = await RegionRepository.find({
      relations: ["countries"]
    });

    logger.info(`Found ${regions.length} regions for collection creation`);

    const continentMap = {
      "EU": {
        title: "Europe",
        image: "/hero/europe.svg",
        coverages: ["EU"]
      },
      "ASIA": {
        title: "Asia",
        image: "/hero/asia.svg",
        coverages: ["ASIA"]
      },
      "NA": {
        title: "North America",
        image: "/hero/north-america.svg", 
        coverages: ["NA", "USA", "CAN", "MEX"]
      },
      "SA": {
        title: "South America",
        image: "/hero/south-america.svg",
        coverages: ["SA"]
      },
      "AF": {
        title: "Africa",
        image: "/hero/africa.svg",
        coverages: ["AF"]
      },
      "OC": {
        title: "Oceania",
        image: "/hero/oceania.svg",
        coverages: ["OC", "AUS", "NZ"]
      },
      "GLOBAL": {
        title: "Global",
        image: "/hero/global.svg",
        coverages: ["GLOBAL"]
      }
    };

    for (const [code, continent] of Object.entries(continentMap)) {
      const handle = `continent-${code.toLowerCase()}`;
      
      const continentData = {
        title: continent.title,
        handle: handle,
        metadata: {
          isContinent: "true",
          image: {
            url: continent.image
          },
          coverage_codes: continent.coverages,
        },
      };

      const existingCollection = await ProductCollectionRepository.findOne({
        where: { handle: continentData.handle }
      });

      let collection;
      if (existingCollection) {
        collection = await productCollectionService.update(existingCollection.id, continentData);
        logger.info(`Updated continent collection ${collection.title}`);
      } else {
        collection = await productCollectionService.create(continentData);
        logger.info(`Created new continent collection ${collection.title}`);
      }
      
      createdCollections.push(collection);
    }

    for (const pkg of packages) {
      const { coverages, channel_dataplan_id, apn, day, price, currency, channel_dataplan_name } = pkg;
      const coverageCodes = Array.isArray(coverages) ? coverages : [coverages];
      
      const matchingRegions = regions.filter(region => {
        const regionCoverages = ((region.metadata?.coverage_codes || []) as string[]);
        return coverageCodes.some(code => 
          regionCoverages.includes(code.toUpperCase())
        );
      });

      const allCountryCodes = new Set<string>();
      matchingRegions.forEach(region => {
        if (region.countries) {
          region.countries.forEach(country => {
            allCountryCodes.add(country.iso_2.toUpperCase());
          });
        }
      });

      let continentCode = "GLOBAL";
      for (const [code, continent] of Object.entries(continentMap)) {
        if (coverageCodes.some(coverage => continent.coverages.includes(coverage))) {
          continentCode = code;
          break;
        }
      }

      logger.info(`Collection ${channel_dataplan_name} matches ${matchingRegions.length} regions with ${allCountryCodes.size} countries, belongs to ${continentCode}`);

      const collectionData = {
        title: channel_dataplan_name || `${coverageCodes[0]} ${day} Days`,
        handle: `${coverageCodes[0]}-${channel_dataplan_id}`,
        metadata: {
          apn,
          day,
          price,
          currency,
          region_ids: matchingRegions.map(region => region.id),
          data_plan_id: channel_dataplan_id,
          country_codes: Array.from(allCountryCodes),
          coverage_codes: coverageCodes,
          image: {
            url: continentMap[continentCode]?.image || "/hero/global.svg" 
          },
          continent: continentCode,
          isContinent: "false"
        },
      };

      const existingCollection = await ProductCollectionRepository.findOne({
        where: { handle: collectionData.handle }
      });

      let collection;
      if (existingCollection) {
        collection = await productCollectionService.update(existingCollection.id, collectionData);
        logger.info(`Updated collection ${collection.title}`);
      } else {
        collection = await productCollectionService.create(collectionData);
        logger.info(`Created new collection ${collection.title}`);
      }
      
      createdCollections.push(collection);
    }
    return createdCollections;
  } catch (error) {
    console.error("Error in collectionCreationHandler:", error);
    throw error;
  }
};

const productCreationHandler = async (
  packageData: TSimPackage[],
  req: MedusaRequest
) => {
  const logger = req.scope.resolve<Logger>("logger");
  try {
    const productService: ProductService = req.scope.resolve(
      "productService"
    ) as ProductService;
    
    const productCollectionService = req.scope.resolve<ProductCollectionService>("productCollectionService");
    
    const salesChannel = await SalesChannelRepository.findOne({
      where: { name: "Default Sales Channel" },
    });

    if (!salesChannel) {
      throw new Error("Default sales channel not found");
    }

    const allCollections = await ProductCollectionRepository.find();

    const regions = await RegionRepository.find({
      relations: ["countries"]
    });

    logger.info(`Found ${regions.length} regions and ${allCollections.length} collections`);

    const createdProducts = [];
    
    for (const packageInfo of packageData) {
      const collectionHandle = `${packageInfo.coverages[0]}-${packageInfo.channel_dataplan_id}`;
      const collection = allCollections.find(c => c.handle === collectionHandle);
      
      if (!collection) {
        logger.warn(`No collection found for package ID: ${packageInfo.channel_dataplan_id} with handle ${collectionHandle}`);
        continue;
      }
      
      const matchingRegions = regions.filter(region => {
        const regionCoverages = ((region.metadata?.coverage_codes || []) as string[]);
        return packageInfo.coverages.some(coverage => 
          regionCoverages.includes(coverage.toUpperCase())
        );
      });

      if (matchingRegions.length === 0) {
        logger.warn(`No matching regions found for package with coverages: ${packageInfo.coverages.join(', ')}`);
        continue;
      }
      const allCountryCodes = new Set<string>();
      matchingRegions.forEach(region => {
        if (region.countries) {
          region.countries.forEach(country => {
            allCountryCodes.add(country.iso_2.toUpperCase());
          });
        }
      });
      await productCollectionService.update(collection.id, {
        metadata: {
          ...collection.metadata,
          country_codes: Array.from(allCountryCodes),
          image: {
            url: "/hero/global.svg"
          }
        }
      });
      
      logger.info(`Updated collection ${collection.title} with ${allCountryCodes.size} countries`);

      for (const region of matchingRegions) {
        const uniqueHandle = `${packageInfo.channel_dataplan_id}-${region.id.substring(0, 8)}-${uuidv4().substring(0, 8)}`;
        
        logger.info(`Creating product for package ${packageInfo.channel_dataplan_name} in region ${region.name}`);
        
        try {
          const product = await productService.create({
            title: `${packageInfo.channel_dataplan_name}`,
            handle: uniqueHandle,
            metadata: {
              package_id: packageInfo.channel_dataplan_id,
              original_handle: packageInfo.channel_dataplan_id,
              region_id: region.id,
              coverage_codes: packageInfo.coverages,
              day: packageInfo.day,
              apn: packageInfo.apn,
              countries: Array.from(allCountryCodes)
            },
            description: packageInfo.remark || `eSIM package valid for ${packageInfo.day} days`,
            collection_id: collection.id,
            options: [{ title: "Type" }],
            status: ProductStatus.PUBLISHED,
            sales_channels: [{ id: salesChannel.id }],
            thumbnail: "",
            variants: [
              {
                title: "eSIM",
                prices: [
                  {
                    amount: Math.round(parseFloat(packageInfo.price) * 100),
                    currency_code: region.currency_code,
                  },
                ],
                options: [{ value: "eSIM" }],
                metadata: {
                  day: packageInfo.day,
                  apn: packageInfo.apn,
                  coverages: packageInfo.coverages,
                  region_id: region.id,
                  data_plan_id: packageInfo.channel_dataplan_id
                },
                inventory_quantity: 100,
                manage_inventory: false,
              },
            ],
          });
          createdProducts.push(product);
        } catch (err) {
          logger.error(`Failed to create product for ${packageInfo.channel_dataplan_name} in region ${region.name}:`, err);
          logger.error(err.stack);
        }
      }
    }
    logger.info(`Successfully created ${createdProducts.length} products`);
    return createdProducts;
  } catch (e) {
    logger.error("Error in productCreationHandler:", e);
    throw new Error(`Error in creating products: ${e.message}`);
  }
};

const createDefaultSalesChannel = async (req: MedusaRequest) => {
  const salesChannelService = req.scope.resolve<SalesChannelService>("salesChannelService");
  const logger = req.scope.resolve<Logger>("logger");

  try {
    const existingChannel = await SalesChannelRepository.findOne({
      where: { name: "Default Sales Channel" }
    });

    if (existingChannel) {
      logger.info("Found existing default sales channel");
      return existingChannel;
    }
    logger.info("Creating default sales channel...");
    const channel = await salesChannelService.create({
      name: "Default Sales Channel",
      description: "Default sales channel for eSIM products",
      is_disabled: false
    });
    logger.info(`Created default sales channel with ID: ${channel.id}`);
    return channel;
  } catch (error) {
    logger.error("Error creating default sales channel:", error);
    throw new Error("Failed to create default sales channel");
  }
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve<Logger>("logger");
  try {
    logger.info("Ensuring default sales channel exists...");
    const salesChannel = await createDefaultSalesChannel(req);
    
    let tsimData = await packagesDataFetcher();
    if (!tsimData || !tsimData.result || !Array.isArray(tsimData.result)) {
      throw new Error("Invalid response format from TSim API");
    }
    const validPackages = tsimData.result.filter(pkg => 
      pkg.coverages && pkg.coverages.length > 0
    );
    logger.info(`Processing ${validPackages.length} valid packages...`);
    const collections = await collectionCreationHandler(validPackages, req.scope);
    logger.info(`Created ${collections.length} collections`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info(`Creating products for ${validPackages.length} packages`);
    const productData = await productCreationHandler(validPackages, req);
    logger.info(`Created ${productData.length} products successfully`);
    return res.send({
      status: true,
      data: { 
        packagesCount: validPackages.length,
        collectionsCreated: collections.length,
        productsCreated: productData.length,
        salesChannelId: salesChannel.id
      },
    });
  } catch (e) {
    logger.error("Error in GET handler:", e);
    return res.send({ 
      status: false, 
      message: e.message,
      stack: e.stack,
      details: e.detail || null
    });
  }
};
