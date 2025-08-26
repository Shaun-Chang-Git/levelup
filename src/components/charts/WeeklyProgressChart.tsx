import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import { Box, Typography, Paper, useTheme } from '@mui/material';

interface WeeklyData {
  date: string;
  day: string;
  value: number;
}

interface WeeklyProgressChartProps {
  data: WeeklyData[];
  height?: number;
  showArea?: boolean;
}

const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  data,
  height = 300,
  showArea = false,
}) => {
  const theme = useTheme();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {data.day} ({new Date(data.date).toLocaleDateString()})
          </Typography>
          <Typography variant="body1" color="primary.main" fontWeight="bold">
            진행률: {payload[0].value}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          주간 진행률 데이터가 없습니다
        </Typography>
      </Box>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            domain={[0, 'dataMax + 10']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {showArea ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.3}
              strokeWidth={3}
              dot={{
                fill: theme.palette.primary.main,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: theme.palette.primary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
              }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{
                fill: theme.palette.primary.main,
                strokeWidth: 2,
                stroke: theme.palette.background.paper,
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: theme.palette.primary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 2,
              }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </Box>
  );
};

export default WeeklyProgressChart;