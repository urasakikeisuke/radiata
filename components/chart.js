/** @format */

import React from "react";
import {
  LineChart,
  Line,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  useDefaultFetcher,
  CircularBuffer,
  interpolateColors,
  getColor
} from "./utils";

const BASE_COLOR = "#c7463e";

const usageParser = (data, buffer) => {
  if (data == null) return;

  const result = {
    name: Math.random().toString(),
    data: data
  };

  buffer.append(result);
};

export function UsageChart({
  endpoint,
  width,
  intervalMs,
  fetcher = useDefaultFetcher
}) {
  const data = fetcher(endpoint, intervalMs);

  return (
    <>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart
          width={width}
          height={"100px"}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
          data={data}
        >
          <YAxis
            type="number"
            domain={[0, 100]}
            allowDecimals={false}
            allowDataOverflow={true}
            tickLine={false}
            tickSize={4}
            tickCount={3}
            unit={" %"}
            style={{
              fontSize: "0.75rem",
              fontFamily: "Open Sans"
            }}
          />
          <Line
            key={"data"}
            type="basis"
            dataKey={"data"}
            stackId="1"
            unit={"%"}
            stroke={BASE_COLOR}
            fill={BASE_COLOR}
            isAnimationActive={false}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export function UsageChartLegacy({
  endpoint,
  width,
  intervalMs,
  buffer = new CircularBuffer(100),
  fetcher = useDefaultFetcher
}) {
  const data = fetcher(endpoint, intervalMs);
  usageParser(data, buffer);

  return (
    <>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart
          width={width}
          height={"100px"}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
          data={buffer.toArray()}
        >
          <YAxis
            type="number"
            domain={[0, 100]}
            allowDecimals={false}
            allowDataOverflow={true}
            tickLine={false}
            tickSize={4}
            tickCount={3}
            unit={" %"}
            style={{
              fontSize: "0.75rem",
              fontFamily: "Open Sans"
            }}
          />
          <Line
            key={"data"}
            type="basis"
            dataKey={"data"}
            stackId="1"
            unit={"%"}
            stroke={BASE_COLOR}
            fill={BASE_COLOR}
            isAnimationActive={false}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export function UsagesChart({
  endpoint,
  width,
  intervalMs,
  fetcher = useDefaultFetcher
}) {
  const data = fetcher(endpoint, intervalMs);

  const Charts =
    data == null
      ? null
      : data.map((_, index) => {
          const color = getColor(index);

          return (
            <Line
              key={`${index}`}
              type="basis"
              dataKey={`${index}`}
              stackId="1"
              unit={"%"}
              stroke={color}
              fill={color}
              isAnimationActive={false}
              dot={false}
            />
          );
        });

  return (
    <>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart
          width={width}
          height={"100px"}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
          data={data}
        >
          <YAxis
            type="number"
            domain={[0, 100]}
            allowDecimals={false}
            allowDataOverflow={true}
            tickLine={false}
            tickSize={4}
            tickCount={3}
            unit={" %"}
            style={{
              fontSize: "0.75rem",
              fontFamily: "Open Sans"
            }}
          />
          {Charts}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

const defaultLabel = (title) =>
  function func({
    cx,
    cy,
    _midAngle,
    _innerRadius,
    _outerRadius,
    percent,
    index
  }) {
    if (index == 1) return null;

    const labelLines = [
      { text: `${title}`, fontSize: "0.8rem", fill: "#9e9e9e" },
      {
        text: `${(percent * 100).toFixed(0)} %`,
        fontSize: "1.35rem",
        fontWeight: "bold",
        fontFamily: "Source Code Pro",
        fill: "#dddddd"
      }
    ];

    return (
      <text
        x={cx}
        y={cy - 13}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {labelLines.map((line, i) => (
          <tspan
            key={i}
            x={cx}
            dy={i === 0 ? 0 : 25}
            fontSize={line.fontSize}
            fontWeight={line.fontWeight}
            fontFamily={line.fontFamily}
            fill={line.fill}
          >
            {line.text}
          </tspan>
        ))}
      </text>
    );
  };

const chartColor = interpolateColors("#7B68EE", "#CD121D", 100);

export function PercentPieChart({
  endpoint,
  title,
  intervalMs,
  parser,
  label = defaultLabel,
  fetcher = useDefaultFetcher
}) {
  const data = parser(fetcher(endpoint, intervalMs));

  const COLORS = [
    data == null ? "#353535" : chartColor[Math.round(data[0].value)],
    "#353535"
  ];

  return (
    <ResponsiveContainer width="100%" height={130}>
      <PieChart width={300} height={300}>
        <Pie
          data={
            data == null
              ? [
                  {
                    name: "target",
                    value: 0
                  },
                  {
                    name: "rest",
                    value: 100 - 0
                  }
                ]
              : data
          }
          cx="50%"
          cy="50%"
          labelLine={false}
          label={label(title)}
          innerRadius={55}
          outerRadius={65}
          fill="#353535"
          stroke={null}
          dataKey="value"
          isAnimationActive={false}
        >
          {data?.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
