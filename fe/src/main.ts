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

let plotted = false;

async function renderSpectrumData() {
  const { data, error } = await client.GET("/spectrum");
  if (error || !data) {
    console.error(error);
    return;
  }

  const trace = { x: data?.wavenumbers, y: data?.data, type: "scatter" };
  const layout = {
    xaxis: { title: "Wavenumber (cm)" },
    yaxis: { title: "Absorbance [mAU]", range: [-0.002, 0.085] },
  };

  if (!plotted) {
    Plotly.newPlot("plot", [trace], layout);
    plotted = true;
  } else {
    Plotly.react("plot", [trace], layout);
  }
}

renderSpectrumData();
setInterval(renderSpectrumData, 500);
