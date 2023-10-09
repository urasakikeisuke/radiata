/** @format */

import { useState, useEffect } from "react";

export function contains(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].includes(target)) {
      return true;
    }
  }

  return false;
}

export const useDefaultFetcher = (
  endpoint,
  intervalMs,
  onFailedValue = null
) => {
  const [data, setData] = useState(onFailedValue);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        const result = await response.json();
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (isMounted) {
          setData(onFailedValue);
        }
      }
    };

    fetchData();

    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [endpoint, intervalMs]);

  return data == null ? onFailedValue : data;
};

export const parseUnit = (suffix, base) => (x) => {
  if (x == null) return "N/A";

  const units =
    base === 1024
      ? ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"]
      : ["", "K", "M", "G", "T", "P", "E", "Z"];

  for (const unit of units) {
    if (Math.abs(x) < base) return `${x.toFixed(1)} ${unit}${suffix}`;
    x /= base;
  }

  return `${x.toFixed(2)} Yi${suffix}`;
};

export class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.head = 0;
    this.tail = 0;
    this.length = 0;
  }

  isFull() {
    return this.length === this.size;
  }

  isEmpty() {
    return this.length === 0;
  }

  append(item) {
    if (this.isFull()) {
      this.pop();
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.size;
    this.length++;
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error("Circular buffer is empty");
    }

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.size;
    this.length--;
    return item;
  }

  peek() {
    if (this.isEmpty()) {
      throw new Error("Circular buffer is empty");
    }

    return this.buffer[this.head];
  }

  clear() {
    this.head = 0;
    this.tail = 0;
    this.length = 0;
    this.buffer.fill(null);
  }

  toArray() {
    const result = [];
    let current = this.head;

    for (let i = 0; i < this.length; i++) {
      result.push(this.buffer[current]);
      current = (current + 1) % this.size;
    }

    return result;
  }
}

export function interpolateColors(hexColor1, hexColor2, steps) {
  const color1 = hexToRGBA(hexColor1);
  const color2 = hexToRGBA(hexColor2);

  const stepR = (color2.r - color1.r) / steps;
  const stepG = (color2.g - color1.g) / steps;
  const stepB = (color2.b - color1.b) / steps;
  const stepA = (color2.a - color1.a) / steps;

  const interpolatedColors = [];

  for (let i = 0; i <= steps; i++) {
    const r = Math.round(color1.r + stepR * i);
    const g = Math.round(color1.g + stepG * i);
    const b = Math.round(color1.b + stepB * i);
    const a = color1.a + stepA * i;

    const interpolatedColor = `rgba(${r}, ${g}, ${b}, ${a})`;

    interpolatedColors.push(interpolatedColor);
  }

  return interpolatedColors;
}

function hexToRGBA(hex) {
  hex = hex.replace(/^#/, "");

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const a = 1;

  return {
    r,
    g,
    b,
    a
  };
}

const UNSHUFFLED_PALLETE = [
  "rgba(45, 105, 179, 1)",
  "rgba(50, 102, 174, 1)",
  "rgba(55, 100, 170, 1)",
  "rgba(60, 97, 165, 1)",
  "rgba(65, 94, 160, 1)",
  "rgba(70, 91, 156, 1)",
  "rgba(75, 89, 151, 1)",
  "rgba(80, 86, 146, 1)",
  "rgba(85, 83, 142, 1)",
  "rgba(90, 81, 137, 1)",
  "rgba(95, 78, 132, 1)",
  "rgba(100, 75, 127, 1)",
  "rgba(105, 72, 123, 1)",
  "rgba(110, 70, 118, 1)",
  "rgba(115, 67, 113, 1)",
  "rgba(120, 64, 109, 1)",
  "rgba(125, 62, 104, 1)",
  "rgba(130, 59, 99, 1)",
  "rgba(135, 56, 95, 1)",
  "rgba(140, 53, 90, 1)",
  "rgba(145, 51, 85, 1)",
  "rgba(150, 48, 81, 1)",
  "rgba(155, 45, 76, 1)",
  "rgba(160, 42, 71, 1)",
  "rgba(165, 40, 67, 1)",
  "rgba(170, 37, 62, 1)",
  "rgba(175, 34, 57, 1)",
  "rgba(180, 32, 52, 1)",
  "rgba(185, 29, 48, 1)",
  "rgba(190, 26, 43, 1)",
  "rgba(195, 23, 38, 1)",
  "rgba(200, 21, 34, 1)",
  "rgba(205, 18, 29, 1)"
];

const PALLETE = UNSHUFFLED_PALLETE.map((value) => ({
  value,
  sort: Math.random()
}))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value);

export const getColor = (index) => PALLETE[index % PALLETE.length];
