'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/services/supabase'
import { supabaseLogger } from '@/lib/services/logger'

interface DatabaseOperation {
  id: string;
  timestamp: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  duration: number;
  query?: any;
  result?: any;
  error?: any;
  rowCount?: number;
}

// In-memory storage for database operations
const dbOperations: DatabaseOperation[] = [];
const MAX_DB_OPERATIONS = 100;

// Add a new database operation
export function recordDatabaseOperation(operation: Omit<DatabaseOperation, 'id' | 'timestamp'>) {
  const newOperation: DatabaseOperation = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...operation
  };

  dbOperations.unshift(newOperation);

  if (dbOperations.length > MAX_DB_OPERATIONS) {
    dbOperations.pop();
  }

  // Notify subscribers
  subscribers.forEach(subscriber => subscriber(dbOperations));
}

// Subscribers for database operation updates
type DatabaseOperationSubscriber = (operations: DatabaseOperation[]) => void;
const subscribers: DatabaseOperationSubscriber[] = [];

// Subscribe to database operation updates
export function subscribeToDatabaseOperations(callback: DatabaseOperationSubscriber) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function DatabaseMonitor() {
  const [operations, setOperations] = useState<DatabaseOperation[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<DatabaseOperation | null>(null);
  const [activeTab, setActiveTab] = useState<string>('query');
  const [tableInfo, setTableInfo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize with existing operations
    setOperations([...dbOperations]);

    // Subscribe to new operations
    const unsubscribe = subscribeToDatabaseOperations((updatedOperations) => {
      setOperations([...updatedOperations]);
    });

    // Fetch table information
    fetchTableInfo();

    return () => unsubscribe();
  }, []);

  const fetchTableInfo = async () => {
    setIsLoading(true);
    try {
      // This is a simple query to get table information
      // In a real application, you might want to use a more specific query
      const { data, error } = await supabase.rpc('get_table_info');

      if (error) {
        supabaseLogger.error('Failed to fetch table information', error);
      } else if (data) {
        setTableInfo(data);
        supabaseLogger.info('Fetched table information', { tableCount: data.length });
      }
    } catch (error) {
      supabaseLogger.error('Error fetching table information', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOperations = () => {
    dbOperations.length = 0;
    setOperations([]);
    setSelectedOperation(null);
  };

  const filteredOperations = filter
    ? operations.filter(op => op.table === filter)
    : operations;

  const tables = Array.from(new Set(operations.map(op => op.table)));

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {tables.map(table => (
            <Button
              key={table}
              size="sm"
              variant={filter === table ? "default" : "outline"}
              onClick={() => setFilter(table)}
            >
              {table}
            </Button>
          ))}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={fetchTableInfo}>
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={clearOperations}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Card className="p-4 h-full overflow-hidden">
          <Tabs defaultValue="operations">
            <TabsList>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
            </TabsList>
            <TabsContent value="operations" className="mt-2 h-[calc(100%-40px)]">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {filteredOperations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No database operations recorded
                    </div>
                  ) : (
                    filteredOperations.map((operation) => (
                      <div
                        key={operation.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-accent/50 ${selectedOperation?.id === operation.id ? 'bg-accent' : ''}`}
                        onClick={() => setSelectedOperation(operation)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Badge variant={operation.error ? "destructive" : "default"}>
                              {operation.operation}
                            </Badge>
                            <Badge variant="outline">{operation.table}</Badge>
                            {operation.rowCount !== undefined && (
                              <Badge variant="outline">{operation.rowCount} rows</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {operation.duration}ms
                          </span>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(operation.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="tables" className="mt-2 h-[calc(100%-40px)]">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading table information...
                  </div>
                ) : tableInfo.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No table information available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tableInfo.map((table, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <h4 className="font-medium">{table.table_name}</h4>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Rows: </span>
                            <span>{table.row_count}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size: </span>
                            <span>{table.size}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-4 h-full overflow-hidden">
          <h3 className="text-sm font-medium mb-2">Details</h3>
          {selectedOperation ? (
            <div className="h-[calc(100%-30px)]">
              <div className="mb-2">
                <p className="text-sm font-medium">{selectedOperation.operation} on {selectedOperation.table}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={selectedOperation.error ? "destructive" : "default"}>
                    {selectedOperation.operation}
                  </Badge>
                  {selectedOperation.rowCount !== undefined && (
                    <Badge variant="outline">{selectedOperation.rowCount} rows</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {selectedOperation.duration}ms
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedOperation.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <Tabs defaultValue="query" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="query">Query</TabsTrigger>
                  <TabsTrigger value="result">Result</TabsTrigger>
                  {selectedOperation.error && (
                    <TabsTrigger value="error">Error</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="query" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {selectedOperation.query
                        ? JSON.stringify(selectedOperation.query, null, 2)
                        : 'No query data available'}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="result" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                      {selectedOperation.result
                        ? JSON.stringify(selectedOperation.result, null, 2)
                        : 'No result data available'}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                {selectedOperation.error && (
                  <TabsContent value="error" className="mt-2">
                    <ScrollArea className="h-[calc(100vh-350px)]">
                      <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto text-red-500">
                        {JSON.stringify(selectedOperation.error, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-30px)]">
              <p className="text-muted-foreground">Select a database operation to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
