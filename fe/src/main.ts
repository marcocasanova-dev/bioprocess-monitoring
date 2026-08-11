import Plotly from "plotly.js-dist-min";
import { client } from "./client";

document.querySelector("#start-btn")!.addEventListener("click", async () => {
  await client.POST("/start");
});

document.querySelector("#stop-btn")!.addEventListener("click", async () => {
  await client.POST("/stop");
});

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
