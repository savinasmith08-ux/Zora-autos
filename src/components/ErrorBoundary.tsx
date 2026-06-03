import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Auto-reload once for chunk load errors (which happen during live deployments)
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('dynamically imported module') ||
      error.message.includes('import()');
      
    if (isChunkError) {
      if (!sessionStorage.getItem('chunk_reloaded')) {
        sessionStorage.setItem('chunk_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            We experienced an issue loading this page. This usually happens when the application receives an update while you're browsing.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    // Reset the reload flag if rendering succeeds
    sessionStorage.removeItem('chunk_reloaded');
    return this.props.children;
  }
}
