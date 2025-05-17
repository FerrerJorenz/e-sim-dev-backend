import {
  type ProductCollectionService,
  type ScheduledJobConfig,
  type ScheduledJobArgs,
} from "@medusajs/medusa";
import Meilisearch from "meilisearch";

export default async function handle({
  container,
  data,
  pluginOptions,
}: ScheduledJobArgs) {
  const collectionService: ProductCollectionService = container.resolve(
    "productCollectionService"
  );
  const client = new Meilisearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY,
  });
  const collections = await collectionService.list({},{
    skip:0,
    take:100
  });
  const collectionsData = collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    // @ts-ignore
    thumbnail: collection.metadata!.image!.url || "",
  }));
  await client.index("collections").addDocuments(collectionsData);

  console.log("Successfully finished the job");
}

export const config: ScheduledJobConfig = {
  name: "publish-once-a-day",
  schedule: "* * * * *",
  data: {},
};
