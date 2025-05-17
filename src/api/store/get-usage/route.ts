import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import axios from "axios";

const SIM_CACHE = new Map<string, { data: any; timestamp: number }>();

const fetchSimData = async (iccid: string) => {
  const cacheKey = `simData_${iccid}`;
  const cachedData = SIM_CACHE.get(cacheKey);
  const cacheDuration = 15 * 60 * 1000;

  if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
    return cachedData.data;
  }
  try {
    let res = await axios.post(`${process.env.API_URL_V2}/sims/ESim-Usage`, {
      "iccid": iccid,
    }, {
      headers: { Authorization: `Bearer ${process.env.API_ACCESS_TOKEN}` },
    });
    SIM_CACHE.set(cacheKey, { data: res.data, timestamp: Date.now() });
    return res.data;
  } catch (error) {
    return error;
  }
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { iccid } = req.query;

  if (!iccid || typeof iccid !== "string") {
    return res.send({
      status: false,
      message: "ICCID is required and must be a string",
    });
    return;
  }

  try {
    const data = await fetchSimData(iccid);
    return res.send({ data });
  } catch (error) {
    return res.send({ status: false, message: error });
  }
};
