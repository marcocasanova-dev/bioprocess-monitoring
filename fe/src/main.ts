import Plotly from "plotly.js-dist-min";
import { client } from "./client";

document.querySelector("#start-btn")!.addEventListener("click", async () => {
  await client.POST("/start");
});

document.querySelector("#stop-btn")!.addEventListener("click", async () => {
  await client.POST("/stop");
});

document.querySelector("#jump-btn")!.addEventListener("click", async () => {
  const input = document.querySelector("#jump-input") as HTMLInputElement;
  const index = Number(input.value);
  await client.POST("/jump/{index}", {
    params: { path: { index } },
  });
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
