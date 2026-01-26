import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Upload, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Product Card Generator</h1>
          <p className="text-slate-600 mb-8">Create professional product cards with AI-powered design and background removal</p>
          <Button onClick={() => window.location.href = getLoginUrl()} size="lg" className="w-full">
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Product Card Generator</h1>
            <p className="text-slate-600">Welcome, {user?.name}! Create stunning product cards in seconds.</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload CSV</h3>
            <p className="text-slate-600 text-sm">Import your product data with SKU, name, and description</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI-Powered Design</h3>
            <p className="text-slate-600 text-sm">Gemini extracts product data and generates marketing copy</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Background Removal</h3>
            <p className="text-slate-600 text-sm">Pixelcut removes backgrounds and generates contextual scenes</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Create?</h2>
          <p className="text-slate-600 mb-8">Start generating professional product cards with AI assistance</p>
          <Button onClick={() => setLocation("/generator")} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Go to Card Generator
          </Button>
        </div>
      </div>
    </div>
  );
}
