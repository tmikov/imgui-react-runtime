// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Reconciliation timing statistics - module scope for efficiency
const RECONCILIATION_SAMPLE_SIZE = 30;
const MAX_WINDOW_SECONDS = 5;

let reconciliationSamples = [];  // Array of {time: timestamp, duration: ms}
let reconciliationAverage = 0;
let reconciliationMax = 0;

/**
 * Update reconciliation timing statistics.
 * Maintains a moving average of the last N samples and a time-windowed max.
 */
export function updateReconciliationStats(duration) {
  const now = performance.now();

  // Add new sample
  reconciliationSamples.push({ time: now, duration });

  // Keep only last N samples for average
  if (reconciliationSamples.length > RECONCILIATION_SAMPLE_SIZE) {
    reconciliationSamples.shift();
  }

  // Calculate average from all samples
  let sum = 0;
  for (let i = 0; i < reconciliationSamples.length; i++) {
    sum += reconciliationSamples[i].duration;
  }
  reconciliationAverage = sum / reconciliationSamples.length;

  // Calculate max from samples within time window
  const cutoffTime = now - (MAX_WINDOW_SECONDS * 1000);
  reconciliationMax = 0;
  for (let i = 0; i < reconciliationSamples.length; i++) {
    if (reconciliationSamples[i].time >= cutoffTime) {
      if (reconciliationSamples[i].duration > reconciliationMax) {
        reconciliationMax = reconciliationSamples[i].duration;
      }
    }
  }

  // Expose to globalThis for C++ access
  if (!globalThis.perfMetrics) {
    globalThis.perfMetrics = {};
  }
  globalThis.perfMetrics.reconciliationAvg = reconciliationAverage;
  globalThis.perfMetrics.reconciliationMax = reconciliationMax;
}
