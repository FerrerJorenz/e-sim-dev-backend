import {
  MedusaRequest,
  MedusaResponse,
  Logger,
  ProductCollection,
  ProductService,
  ProductStatus,
  Region as MedusaRegion,
  Country
} from "@medusajs/medusa";
import ProductCollectionRepository from "@medusajs/medusa/dist/repositories/product-collection";
import RegionRepository from "@medusajs/medusa/dist/repositories/region";
import SalesChannelRepository from "@medusajs/medusa/dist/repositories/sales-channel";
import axios from "axios";
import { uuid } from "uuidv4";
import { generateTsimHeaders } from "../../../util/preScript";
import { regionMapping } from "../../../config/region-mapping";
import { In, DeepPartial } from "typeorm";
import { RegionService } from "@medusajs/medusa";

// Type definitions
type LocalCountry = {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  image: string;
};

type Region = {
  id: string;
  name: string;
  image: string;
};

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

// Update the RegionCreationHandler function
const RegionCreationHandler = async (req: MedusaRequest, coverage: string) => {
  try {
    const region = Object.entries(regionMapping).find(([_, config]) =>
      config.coverage_codes.includes(coverage.toUpperCase())
    );

    if (!region) {
      console.log(`No region mapping found for coverage: ${coverage}`);
      return false;
    }

    const [regionKey, regionConfig] = region;
    const regionId = `region-${regionKey.toLowerCase()}`;

    // Create region data with all available payment providers
    const parsedRegionData = {
      id: regionId,
      name: regionConfig.name,
      currency_code: regionConfig.currency_code.toLowerCase(),
      tax_rate: 0,
      payment_providers: ["manual", "paypal"], // Include all payment providers
      fulfillment_providers: ["manual"],
      metadata: {
        coverage_codes: regionConfig.coverage_codes,
        original_coverage: coverage
      }
    };

    console.log(`Creating region: ${JSON.stringify(parsedRegionData, null, 2)}`);

    const regionService = req.scope.resolve("regionService") as RegionService;

    // Create region with all required configurations
    await regionService.create({
      ...parsedRegionData,
      countries: regionConfig.countries.map(code => code.toLowerCase()),
    });

    return true;
  } catch (e) {
    console.error(`Error creating region for coverage ${coverage}:`, e);
    console.error('Full error:', e.stack);
    return false;
  }
};


export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger") as Logger; // Corrected casting here
  try {
    const tsimData = await packagesDataFetcher();

    if (!tsimData || !tsimData.result || !Array.isArray(tsimData.result)) {
      throw new Error("Invalid response format from TSim API");
    }

    // Extract unique coverages from all packages
    const uniqueCoverages = new Set<string>();
    tsimData.result.forEach(pkg => {
      if (pkg.coverages) {
        pkg.coverages.forEach(coverage => {
          uniqueCoverages.add(coverage);
        });
      }
    });

    console.log(`Found ${uniqueCoverages.size} unique coverages to process`);

    // Create regions for each unique coverage
    const results = await Promise.all(
      Array.from(uniqueCoverages).map(async (coverage) => {
        return await RegionCreationHandler(req, coverage);
      })
    );

    // Get all created regions
    const createdRegions = await RegionRepository.find({
      relations: ["countries"]
    });

    const successfulRegions = results.filter(result => result === true).length;
    console.log(`Successfully created ${successfulRegions} regions`);

    return res.send({
      status: true,
      data: {
        processed_coverages: Array.from(uniqueCoverages),
        regions_created: successfulRegions,
        total_regions: createdRegions.length,
        regions: createdRegions.map(region => ({
          id: region.id,
          name: region.name,
          currency_code: region.currency_code,
          countries: region.countries.map(c => c.iso_2),
          metadata: region.metadata
        }))
      },
      message: `Regions created successfully. Processed ${uniqueCoverages.size} coverages, created ${successfulRegions} regions.`
    });
  } catch (e) {
    logger.error("Error in GET handler:", e);
    return res.send({
      status: false,
      message: e.message,
      error: e.stack
    });
  }
};
