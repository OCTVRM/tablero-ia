"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertTriangle, HelpCircle, AlertOctagon, Lightbulb, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { regenerateAnalysisAction, deleteMeetingAction } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


type AnalysisData = {
    summary: string;
    participants: string[];
    context: string;
    main_idea: string;
    key_insights: string[];
    decisions: string[];
    risks: string[];
    open_questions: string[];
    pending_topics: string[];
};

export function MeetingAnalysis({ meeting, tasks }: { meeting: any, tasks: any[] }) {
    const analysis = meeting.analysis_json as AnalysisData;

    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleRegenerate = async (focus: "executive" | "technical" | "tasks") => {
        setIsRegenerating(true);
        await regenerateAnalysisAction(meeting.id, focus);
        setIsRegenerating(false);
        router.refresh();
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteMeetingAction(meeting.id);
        if (result.success) {
            router.push("/dashboard");
        } else {
            setIsDeleting(false);
            console.error(result.error);
        }
    };

    if (!analysis) {
        return <div className="p-4">Análisis no disponible todavía.</div>;
    }

    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg mb-4">
                <TabsList className="bg-transparent">
                    <TabsTrigger value="overview">Resumen & Ideas</TabsTrigger>
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                    <TabsTrigger value="tasks">Tareas ({tasks.length})</TabsTrigger>
                    <TabsTrigger value="minuta">Minuta</TabsTrigger>
                    <TabsTrigger value="transcript">Transcripción</TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isRegenerating || isDeleting} className="gap-2">
                                {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Re-analizar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRegenerate("executive")}>
                                Enfoque Ejecutivo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerate("technical")}>
                                Enfoque Técnico
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerate("tasks")}>
                                Solo Tareas
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDeleting} className="gap-2">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el análisis
                                    de la reunión y todas sus tareas asociadas de nuestros servidores.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Resumen Ejecutivo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-7">{analysis.summary}</p>
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Idea Principal</h4>
                                <p className="text-muted-foreground">{analysis.main_idea}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Contexto y Participantes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Participantes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.participants.map((p, i) => (
                                        <Badge key={i} variant="secondary">{p}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contexto</h4>
                                <p className="text-sm">{analysis.context}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" /> Key Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1">
                            {analysis.key_insights.map((insight, i) => (
                                <li key={i}>{insight}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> Decisiones
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1">
                                {analysis.decisions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" /> Riesgos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1">
                                {analysis.risks.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-500" /> Preguntas Abiertas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1">
                                {analysis.open_questions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertOctagon className="h-5 w-5 text-orange-500" /> Temas Pendientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1">
                                {analysis.pending_topics.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="tasks">
                <Card>
                    <CardHeader>
                        <CardTitle>Tareas Detectadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TaskList tasks={tasks} meetingId={meeting.id} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="minuta">
                <Card>
                    <CardHeader>
                        <CardTitle>Minuta de Reunión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] w-full rounded-md p-4">
                            <div className="space-y-6 font-sans">
                                {/* Header */}
                                <div className="border-b pb-4">
                                    <h2 className="text-2xl font-bold mb-2">{meeting.title}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Fecha: {new Date(meeting.date).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Participants */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Participantes</h3>
                                    <ul className="list-disc pl-6 space-y-1">
                                        {analysis.participants.map((p, i) => (
                                            <li key={i} className="text-sm">{p}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Context */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Contexto</h3>
                                    <p className="text-sm leading-relaxed">{analysis.context}</p>
                                </div>

                                {/* Main Idea */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Objetivo de la Reunión</h3>
                                    <p className="text-sm leading-relaxed">{analysis.main_idea}</p>
                                </div>

                                {/* Summary */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Resumen Ejecutivo</h3>
                                    <p className="text-sm leading-relaxed">{analysis.summary}</p>
                                </div>

                                {/* Key Insights */}
                                {analysis.key_insights && analysis.key_insights.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Puntos Clave</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                            {analysis.key_insights.map((insight, i) => (
                                                <li key={i} className="text-sm">{insight}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Decisions */}
                                {analysis.decisions && analysis.decisions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Decisiones Tomadas</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                            {analysis.decisions.map((item, i) => (
                                                <li key={i} className="text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Tasks */}
                                {tasks && tasks.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Tareas Asignadas</h3>
                                        <div className="space-y-2">
                                            {tasks.map((task, i) => (
                                                <div key={i} className="border-l-2 border-primary pl-3 py-1">
                                                    <p className="text-sm font-medium">{task.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Responsable: {task.assignee}
                                                        {task.due_date && ` • Fecha límite: ${new Date(task.due_date).toLocaleDateString('es-ES')}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Risks */}
                                {analysis.risks && analysis.risks.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Riesgos Identificados</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                            {analysis.risks.map((item, i) => (
                                                <li key={i} className="text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Open Questions */}
                                {analysis.open_questions && analysis.open_questions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Preguntas Abiertas</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                            {analysis.open_questions.map((item, i) => (
                                                <li key={i} className="text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Pending Topics */}
                                {analysis.pending_topics && analysis.pending_topics.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Temas Pendientes</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                            {analysis.pending_topics.map((item, i) => (
                                                <li key={i} className="text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="transcript">
                <Card>
                    <CardHeader>
                        <CardTitle>Transcripción Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                                {meeting.original_transcript}
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
