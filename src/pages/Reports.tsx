import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Reports() {
  const reportTypes = [
    { name: "Inventory Report", description: "Detailed inventory status", date: "2024-07-17" },
    { name: "Sales Report", description: "Monthly sales overview", date: "2024-07-01" },
    { name: "Customer Report", description: "Customer activity insights", date: "2024-06-15" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportTypes.map((report) => (
                <TableRow key={report.name}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}