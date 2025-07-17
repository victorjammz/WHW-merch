import { useState } from "react";
import { Download, FileText, Calendar, Filter, TrendingUp, Package, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock report data
const reportTemplates = [
  {
    id: "sales-summary",
    name: "Sales Summary",
    description: "Overview of sales performance and trends",
    category: "Sales",
    lastGenerated: "2024-01-15"
  },
  {
    id: "inventory-report",
    name: "Inventory Report",
    description: "Current stock levels and inventory movements",
    category: "Inventory",
    lastGenerated: "2024-01-14"
  },
  {
    id: "customer-analysis",
    name: "Customer Analysis",
    description: "Customer demographics and purchasing behavior",
    category: "Customer",
    lastGenerated: "2024-01-13"
  },
  {
    id: "financial-report",
    name: "Financial Report",
    description: "Revenue, expenses, and profit analysis",
    category: "Financial",
    lastGenerated: "2024-01-12"
  }
];

const recentReports = [
  {
    id: "1",
    name: "Weekly Sales Report",
    type: "Sales Summary",
    generatedBy: "System",
    date: "2024-01-15",
    status: "completed",
    size: "2.4 MB"
  },
  {
    id: "2",
    name: "Inventory Audit Q1",
    type: "Inventory Report",
    generatedBy: "John Smith",
    date: "2024-01-14",
    status: "completed",
    size: "1.8 MB"
  },
  {
    id: "3",
    name: "Customer Insights",
    type: "Customer Analysis",
    generatedBy: "Sarah Johnson",
    date: "2024-01-13",
    status: "processing",
    size: "3.2 MB"
  }
];

const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const filteredTemplates = reportTemplates.filter(template =>
    selectedCategory === "all" || template.category.toLowerCase() === selectedCategory
  );

  const handleGenerateReport = (templateId: string) => {
    console.log("Generating report:", templateId);
    // Here you would implement the actual report generation logic
  };

  const handleDownloadReport = (reportId: string) => {
    console.log("Downloading report:", reportId);
    // Here you would implement the download logic
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and download business reports
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sales</div>
            <p className="text-xs text-muted-foreground">
              Report category
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Analyzed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5K</div>
            <p className="text-xs text-muted-foreground">
              Records processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. File Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8 MB</div>
            <p className="text-xs text-muted-foreground">
              Per report
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>
            Select a report template and customize parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Report Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>

            <Button 
              onClick={() => selectedTemplate && handleGenerateReport(selectedTemplate)}
              disabled={!selectedTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
            <CardDescription>Available report types and templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Last generated: {template.lastGenerated}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport(template.id)}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Recently generated reports and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {report.type} • Generated by {report.generatedBy}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={report.status === "completed" ? "default" : "secondary"}
                      >
                        {report.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.date} • {report.size}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      disabled={report.status !== "completed"}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;