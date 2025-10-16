// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Stock table component - displays live-updating stock prices for cities
import React, { useState, useEffect } from 'react';

// City names for the stock table
const CITIES = [
  "Tokyo", "Delhi", "Shanghai", "Sao Paulo", "Mumbai", "Mexico City",
  "Beijing", "Osaka", "Cairo", "New York", "Dhaka", "Karachi",
  "Buenos Aires", "Kolkata", "Istanbul", "Rio de Janeiro", "Manila",
  "Tianjin", "Kinshasa", "Lahore", "Jakarta", "Seoul", "Wenzhou",
  "Shenzhen", "Chengdu", "Lima", "Bangkok", "London", "Hong Kong",
  "Chongqing", "Hangzhou", "Ho Chi Minh City", "Ahmedabad", "Kuala Lumpur",
  "Pune", "Riyadh", "Miami", "Santiago", "Alexandria", "Saint Petersburg"
];

const NUM_ROWS = 40;
const NUM_COLS = 8;

// Get color based on value
function getValueColor(value) {
  if (value < 33.0) return "#FF0000"; // Red
  if (value < 66.0) return "#00FF00"; // Green
  return "#FFFFFF"; // White
}

export function StockTable() {
  const [data, setData] = useState(() => {
    // Initialize full dataset
    const initialData = [];
    for (let i = 0; i < NUM_ROWS; i++) {
      const row = [];
      for (let j = 0; j < NUM_COLS; j++) {
        row.push(Math.random() * 100);
      }
      initialData.push(row);
    }
    return initialData;
  });

  // Update data every second using setInterval
  useEffect(() => {
    const intervalId = setInterval(() => {
      setData(prevData => {
        const newData = [];
        for (let i = 0; i < NUM_ROWS; i++) {
          const newRow = [];
          for (let j = 0; j < NUM_COLS; j++) {
            let newVal = prevData[i][j] + (Math.random() - 0.5) * 2;
            newVal = Math.min(100, Math.max(0, newVal));
            newRow.push(newVal);
          }
          newData.push(newRow);
        }
        return newData;
      });
    }, 1000);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <window title="Cities Stock Prices" defaultX={100} defaultY={150} defaultWidth={600}>
      <table id="stockTable" columns={NUM_COLS + 1}>
        <tablecolumn label="City" flags={16} width={0} />
        <tablecolumn label="Col 1" flags={8} width={0} />
        <tablecolumn label="Col 2" flags={8} width={0} />
        <tablecolumn label="Col 3" flags={8} width={0} />
        <tablecolumn label="Col 4" flags={8} width={0} />
        <tablecolumn label="Col 5" flags={8} width={0} />
        <tablecolumn label="Col 6" flags={8} width={0} />
        <tablecolumn label="Col 7" flags={8} width={0} />
        <tablecolumn label="Col 8" flags={8} width={0} />
        <tableheader />

        {data.map((row, rowIndex) => (
          <tablerow key={rowIndex}>
            <tablecell index={0}>
              <text>{CITIES[rowIndex % CITIES.length]}</text>
            </tablecell>
            {row.map((value, colIndex) => (
              <tablecell key={colIndex} index={colIndex + 1}>
                <text color={getValueColor(value)}>
                  {value.toFixed(2)}
                </text>
              </tablecell>
            ))}
          </tablerow>
        ))}
      </table>
    </window>
  );
}
