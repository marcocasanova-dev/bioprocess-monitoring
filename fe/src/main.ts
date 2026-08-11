import Plotly from "plotly.js-dist-min";
import { client } from "./client";

async function main() {
  const { data, error } = await client.GET("/spectrum");
  if (error || !data) {
    console.error(error);
    return;
  }
  Plotly.newPlot("plot", [{ y: data?.data, type: "scatter" }], {
    xaxis: { title: "Index (0-N)" },
    yaxis: { title: "Abs" },
  });
  console.log(data, error);
}

main();
