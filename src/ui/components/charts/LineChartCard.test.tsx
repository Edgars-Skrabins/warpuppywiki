import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LineChartCard } from "./LineChartCard";

afterEach(() => {
  cleanup();
});

const series = [
  {
    key: "ak74",
    label: "AK-74",
    points: [
      { x: 0, y: 0.3 },
      { x: 50, y: 0.3 },
      { x: 100, y: 0.4 },
    ],
  },
  {
    key: "mp5",
    label: "MP5",
    points: [
      { x: 0, y: 0.25 },
      { x: 50, y: 0.33 },
      { x: 100, y: 0.5 },
    ],
  },
];

describe("LineChartCard", () => {
  it("renders the title and one line per series", () => {
    const { container } = render(
      <LineChartCard title="Time to kill" series={series} xLabel="Distance" yLabel="TTK" width={600} height={300} />,
    );
    expect(screen.getByRole("heading", { name: "Time to kill" })).toBeInTheDocument();
    expect(container.querySelectorAll(".recharts-line-curve")).toHaveLength(2);
  });

  it("shows a legend only for more than one series", () => {
    const { rerender } = render(
      <LineChartCard title="TTK" series={series} xLabel="Distance" yLabel="TTK" width={600} height={300} />,
    );
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("AK-74MP5");
    rerender(
      <LineChartCard title="TTK" series={series.slice(0, 1)} xLabel="Distance" yLabel="TTK" width={600} height={300} />,
    );
    expect(screen.queryByRole("list", { name: "Legend" })).not.toBeInTheDocument();
  });
});
