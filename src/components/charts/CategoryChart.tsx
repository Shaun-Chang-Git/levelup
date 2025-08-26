import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Box, Typography, Paper, useTheme, Chip } from '@mui/material';

interface CategoryData {
  name: string;
  color: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  height?: number;
  chartType?: 'bar' | 'pie';
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  height = 300,
  chartType = 'bar',
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
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            완료: {data.completed}/{data.total}
          </Typography>
          <Typography variant="body2" color="primary.main">
            완료율: {data.completionRate}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: data.color,
              }}
            />
            <Typography variant="body1" fontWeight="bold">
              {data.name}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            목표 수: {data.total}개
          </Typography>
          <Typography variant="body2" color="text.secondary">
            완료: {data.completed}개
          </Typography>
          <Typography variant="body2" color="primary.main">
            완료율: {data.completionRate}%
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
          카테고리 데이터가 없습니다
        </Typography>
      </Box>
    );
  }

  if (chartType === 'pie') {
    return (
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.3, 80)}
              dataKey="total"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* 범례 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
          {data.map((item) => (
            <Chip
              key={item.name}
              label={`${item.name} (${item.completionRate}%)`}
              size="small"
              sx={{
                backgroundColor: item.color + '20',
                color: item.color,
                border: '1px solid ' + item.color,
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CategoryChart;