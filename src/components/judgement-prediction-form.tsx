
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { judgmentPrediction, JudgmentPredictionInput, JudgmentPredictionOutput } from "@/ai/flows/judgment-prediction";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

const formSchema = z.object({
  legalArgumentType: z.string().min(10, {
    message: "Please describe the legal argument type in at least 10 characters.",
  }).max(300, { message: "Argument type description should not exceed 300 characters."}),
});

type PredictionFormValues = z.infer<typeof formSchema>;

export function JudgementPredictionForm() {
  const [predictionResult, setPredictionResult] = useState<JudgmentPredictionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legalArgumentType: "",
    },
  });

  async function onSubmit(data: PredictionFormValues) {
    setIsLoading(true);
    setError(null);
    setPredictionResult(null);
    try {
      const input: JudgmentPredictionInput = { legalArgumentType: data.legalArgumentType };
      const result = await judgmentPrediction(input);
      setPredictionResult(result);
      toast({
        title: "Prediction Generated",
        description: "AI analysis complete. See results below.",
        action: <CheckCircle2 className="text-green-500" />,
      });
    } catch (err) {
      console.error("Error fetching judgment prediction:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get prediction: ${errorMessage}`);
      toast({
        title: "Prediction Error",
        description: `Could not generate prediction. ${errorMessage}`,
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="legalArgumentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground text-base">Describe the Legal Argument Type</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 'Anticipatory bail application in a cheating case'" 
                    {...field} 
                    className="bg-input focus:ring-primary text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full text-lg py-3 transition-all duration-300 ease-in-out hover:shadow-lg group" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Get AI Prediction
              </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Our AI is processing your request...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle /> Error Generating Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {predictionResult && !isLoading && (
        <Card className="shadow-lg animate-fade-in border-primary/30">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-serif text-primary">AI Judgment Prediction</CardTitle>
            <CardDescription>Analysis based on the argument: "{form.getValues("legalArgumentType")}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <h4 className="font-semibold text-foreground text-md mb-1">Predicted Likely Outcome:</h4>
              <div className="bg-secondary p-4 rounded-md shadow-sm">
                <p className="text-secondary-foreground">{predictionResult.likelyOutcome}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-md mb-1">Reasoning & Basis:</h4>
              <div className="bg-secondary p-4 rounded-md shadow-sm">
                <p className="text-secondary-foreground whitespace-pre-wrap text-sm">{predictionResult.reasoning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
