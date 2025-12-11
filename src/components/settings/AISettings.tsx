"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Bot,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
  Key,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  recommended?: boolean;
  description?: string;
  inputPrice?: string;
  outputPrice?: string;
}

interface Provider {
  id: string;
  name: string;
  models: AIModel[];
}

interface AISettingsData {
  provider: string;
  model: string | null;
  hasApiKey: boolean;
  apiKeyMasked: string | null;
}

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};

export function AISettings() {
  const [settings, setSettings] = useState<AISettingsData | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<string>("anthropic");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings and models
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, modelsRes] = await Promise.all([
          fetch("/api/ai/settings"),
          fetch("/api/ai/models"),
        ]);

        if (!settingsRes.ok || !modelsRes.ok) {
          throw new Error("Failed to load settings");
        }

        const settingsData = await settingsRes.json();
        const modelsData = await modelsRes.json();

        setSettings(settingsData);
        setProviders(modelsData.providers);

        // Set initial form values
        setSelectedProvider(settingsData.provider || "anthropic");
        setSelectedModel(settingsData.model || "");
      } catch (error) {
        console.error("Failed to load AI settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Get models for selected provider
  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const availableModels = currentProvider?.models || [];

  // Update model when provider changes
  useEffect(() => {
    if (availableModels.length > 0) {
      const recommended = availableModels.find((m) => m.recommended);
      const currentModelValid = availableModels.some((m) => m.id === selectedModel);

      if (!currentModelValid) {
        setSelectedModel(recommended?.id || availableModels[0].id);
      }
    }
  }, [selectedProvider, availableModels, selectedModel]);

  // Track changes
  useEffect(() => {
    if (!settings) return;

    const providerChanged = selectedProvider !== settings.provider;
    const modelChanged = selectedModel !== settings.model;
    const apiKeyChanged = apiKey.trim() !== "";

    setHasChanges(providerChanged || modelChanged || apiKeyChanged);
    setTestResult(null); // Reset test result on changes
  }, [selectedProvider, selectedModel, apiKey, settings]);

  // Test API key
  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key to test");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const result = await res.json();
      setTestResult(result);

      if (result.valid) {
        toast.success("API key is valid!");
      } else {
        toast.error(result.error || "Invalid API key");
      }
    } catch (error) {
      console.error("Failed to test API key:", error);
      toast.error("Failed to test API key");
      setTestResult({ valid: false, error: "Connection failed" });
    } finally {
      setIsTesting(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        provider: selectedProvider,
        model: selectedModel,
      };

      // Only include API key if entered
      if (apiKey.trim()) {
        body.apiKey = apiKey.trim();
      }

      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      const result = await res.json();

      setSettings({
        provider: result.provider,
        model: result.model,
        hasApiKey: result.hasApiKey,
        apiKeyMasked: result.apiKeyMasked,
      });

      setApiKey(""); // Clear input after save
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Remove API key
  const handleRemoveApiKey = async () => {
    setIsSaving(true);

    try {
      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: null }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove API key");
      }

      const result = await res.json();

      setSettings({
        provider: result.provider,
        model: result.model,
        hasApiKey: result.hasApiKey,
        apiKeyMasked: result.apiKeyMasked,
      });

      toast.success("API key removed - using system default");
    } catch (error) {
      console.error("Failed to remove API key:", error);
      toast.error("Failed to remove API key");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedModelData = availableModels.find((m) => m.id === selectedModel);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <CardTitle>AI Provider Settings</CardTitle>
            <CardDescription>
              Choose your AI provider and optionally use your own API key
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                id="provider"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {PROVIDER_ICONS[selectedProvider]}
                  </span>
                  {currentProvider?.name || "Select Provider"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
              {providers.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {PROVIDER_ICONS[provider.id]}
                    </span>
                    {provider.name}
                  </span>
                  {provider.id === selectedProvider && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                id="model"
              >
                <span className="flex items-center gap-2">
                  {selectedModelData?.name || "Select Model"}
                  {selectedModelData?.recommended && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[400px]">
              {availableModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      {model.name}
                      {model.recommended && (
                        <Sparkles className="h-3 w-3 text-emerald-500" />
                      )}
                    </span>
                    {model.id === selectedModel && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                    {model.inputPrice && (
                      <span className="ml-2 text-slate-400">
                        {model.inputPrice} / {model.outputPrice} per MTok
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key
            <span className="text-xs text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>

          {/* Current key status */}
          {settings?.hasApiKey && !apiKey && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">
                  Using your API key: {settings.apiKeyMasked}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveApiKey}
                disabled={isSaving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}

          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings?.hasApiKey
                  ? "Enter new key to replace..."
                  : "Enter API key (leave empty for system default)"
              }
              className="pr-20"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Leave empty to use the system default key. Your key is encrypted before storage.
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              testResult.valid
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {testResult.valid ? (
              <>
                <Check className="h-4 w-4" />
                API key is valid and working
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                {testResult.error || "Invalid API key"}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTestApiKey}
            disabled={!apiKey.trim() || isTesting || isSaving}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isTesting}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
