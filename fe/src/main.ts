import { client } from "./client";

async function main() {
  const { data, error } = await client.GET("/spectrum");
  console.log(data, error);
}

main();
