import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface CSVRow {
  sku?: string;
  name: string;
  description?: string;
  category?: string;
  price?: string;
  rowNumber: number;
  errors: string[];
  warnings: string[];
}

interface CSVPreviewProps {
  rows: CSVRow[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CSVPreview({ rows, onConfirm, onCancel, isLoading }: CSVPreviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    new Set(rows.filter((r) => r.errors.length === 0).map((r) => r.rowNumber))
  );

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);
  const warningRows = rows.filter((r) => r.warnings.length > 0 && r.errors.length === 0);

  const toggleRow = (rowNumber: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowNumber)) {
      newSelected.delete(rowNumber);
    } else {
      newSelected.add(rowNumber);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === validRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(validRows.map((r) => r.rowNumber)));
    }
  };

  const handleConfirm = () => {
    if (selectedRows.size === 0) {
      return;
    }
    onConfirm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Import Preview</CardTitle>
          <CardDescription>
            Review the data before importing. You can deselect rows you don't want to import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validRows.length}</div>
              <div className="text-sm text-muted-foreground">Valid Rows</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{warningRows.length}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{invalidRows.length}</div>
              <div className="text-sm text-muted-foreground">Invalid Rows</div>
            </div>
          </div>

          {/* Alerts */}
          {invalidRows.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {invalidRows.length} row(s) contain errors and will be skipped during import.
              </AlertDescription>
            </Alert>
          )}

          {warningRows.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {warningRows.length} row(s) have warnings but can still be imported.
              </AlertDescription>
            </Alert>
          )}

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === validRows.length && validRows.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const hasErrors = row.errors.length > 0;
                    const hasWarnings = row.warnings.length > 0;

                    return (
                      <TableRow
                        key={row.rowNumber}
                        className={hasErrors ? "bg-red-50" : hasWarnings ? "bg-yellow-50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.rowNumber)}
                            onChange={() => toggleRow(row.rowNumber)}
                            disabled={hasErrors}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                        <TableCell className="font-mono text-xs">{row.sku || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.name}</TableCell>
                        <TableCell>{row.category || "-"}</TableCell>
                        <TableCell>{row.price || "-"}</TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Error</span>
                            </div>
                          ) : hasWarnings ? (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Warning</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Error/Warning Details */}
          {(invalidRows.length > 0 || warningRows.length > 0) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Issues Found:</h4>
              <div className="space-y-1 max-h-[150px] overflow-auto">
                {rows
                  .filter((r) => r.errors.length > 0 || r.warnings.length > 0)
                  .map((row) => (
                    <div key={row.rowNumber} className="text-sm">
                      <span className="font-mono text-xs text-muted-foreground">
                        Row {row.rowNumber}:
                      </span>
                      {row.errors.map((err, i) => (
                        <div key={i} className="text-red-600 ml-4">
                          • {err}
                        </div>
                      ))}
                      {row.warnings.map((warn, i) => (
                        <div key={i} className="text-yellow-600 ml-4">
                          • {warn}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedRows.size} row(s) selected for import
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectedRows.size === 0 || isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                Import {selectedRows.size} Product{selectedRows.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
