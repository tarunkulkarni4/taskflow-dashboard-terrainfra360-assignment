"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const data = [
  { name: "Mon", tasks: 12, completed: 8 },
  { name: "Tue", tasks: 19, completed: 15 },
  { name: "Wed", tasks: 15, completed: 12 },
  { name: "Thu", tasks: 22, completed: 18 },
  { name: "Fri", tasks: 28, completed: 25 },
  { name: "Sat", tasks: 14, completed: 10 },
  { name: "Sun", tasks: 9, completed: 7 },
];

export function ProjectOverview() {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div className="space-y-1">
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your task completion trends over the last 7 days</CardDescription>
        </div>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground, #64748b)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground, #64748b)' }}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stroke="var(--color-primary, #3b82f6)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
