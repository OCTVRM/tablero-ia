"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { analyzeMeetingAction } from "@/app/actions";

export default function NewMeeting() {
    const router = useRouter();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<"openai" | "gemini">("openai");

    const onSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            if (date) {
                formData.set("date", date.toISOString());
            }
            formData.set("provider", provider);
            const result = await analyzeMeetingAction(formData);
            if (result.error) {
                setError(result.error);
            } else {
                router.push(`/meeting/${result.id}`);
            }
        } catch (e) {
            setError("Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Reunión</CardTitle>
                    <CardDescription>Sube la transcripción o pega el texto para analizar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título de la Reunión</Label>
                            <Input id="title" name="title" required placeholder="Ej: Daily Sprint #42" />
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <Label>Fecha</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] pl-3 text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        {date ? format(date, "PPP") : <span>Seleccionar fecha</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <input type="hidden" name="date" value={date?.toISOString()} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file">Archivo de Transcripción (.docx)</Label>
                            <Input id="file" name="file" type="file" accept=".docx" />
                            <p className="text-xs text-muted-foreground">Opcional si pegas el texto abajo.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transcript">Texto de la Transcripción</Label>
                            <Textarea
                                id="transcript"
                                name="transcript"
                                placeholder="Pega aquí el texto si no tienes archivo..."
                                className="h-40"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <Label>Proveedor de IA</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    provider === "openai" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground"
                                )}>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">OpenAI</span>
                                        <span className="text-xs text-muted-foreground">GPT-4o-mini</span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="provider"
                                        value="openai"
                                        className="sr-only"
                                        checked={provider === "openai"}
                                        onChange={() => setProvider("openai")}
                                    />
                                </label>
                                <label className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    provider === "gemini" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground"
                                )}>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Google</span>
                                        <span className="text-xs text-muted-foreground">Gemini 1.5 Flash</span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="provider"
                                        value="gemini"
                                        className="sr-only"
                                        checked={provider === "gemini"}
                                        onChange={() => setProvider("gemini")}
                                    />
                                </label>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Analizar con {provider === "openai" ? "OpenAI" : "Gemini"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
