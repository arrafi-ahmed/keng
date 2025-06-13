export const getBarChartOptions = (themeColors) => {
  const onSurfaceColor = themeColors["on-surface"];

  return {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: onSurfaceColor, // Hex legend text color
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: onSurfaceColor, // Hex X-axis tick labels color
        },
      },
      y: {
        ticks: {
          color: onSurfaceColor, // Hex Y-axis tick labels color
        },
      },
    },
  };
};

export const getLineChartOptions = (themeColors) => {
  const onSurfaceColor = themeColors["on-surface"];

  return {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: onSurfaceColor, // Hex X-axis tick labels color
        },
      },
      y: {
        ticks: {
          stepSize: 50,
          color: onSurfaceColor, // Hex Y-axis tick labels color
        },
        beginAtZero: true,
      },
    },
  };
};

export const getCommonDatasetProps = () => ({
  fill: false,
  tension: 0.3,
  pointRadius: 5,
  pointHoverRadius: 7,
});
