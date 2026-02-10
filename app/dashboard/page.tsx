import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Calendar, ArrowRight, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SearchBar } from "@/components/search-bar";
import { signOutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Dashboard({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const supabase = await createClient();
    const { q } = await searchParams;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    let query = supabase
        .from("meetings")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

    if (q) {
        query = query.ilike("title", `%${q}%`);
    }

    const { data: meetings, error } = await query;

    if (error) {
        console.error("Error fetching meetings:", error);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            <div className="container mx-auto p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Mis Reuniones
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona y analiza tus transcripciones.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="w-full md:w-auto">
                            <SearchBar />
                        </div>
                        <ThemeToggle />
                        <form action={signOutAction}>
                            <Button variant="ghost" size="icon" title="Cerrar Sesión">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button asChild>
                            <Link href="/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva
                            </Link>
                        </Button>
                    </div>
                </div>

                {!meetings || meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg border border-dashed">
                        <div className="bg-background p-4 rounded-full mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {q ? "No se encontraron reuniones" : "No hay reuniones"}
                        </h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-sm">
                            {q ? "Intenta con otro término de búsqueda." : "Sube tu primera transcripción para comenzar."}
                        </p>
                        <Button asChild>
                            <Link href="/new">Crear Reunión</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {meetings.map((meeting) => (
                            <Card key={meeting.id} className="flex flex-col transition-all hover:shadow-lg hover:scale-[1.02] border-muted">
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">{meeting.title}</CardTitle>
                                    <CardDescription>
                                        {format(new Date(meeting.date), "PPP", { locale: es })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {meeting.analysis_json?.summary || "Sin resumen disponible."}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full group" asChild>
                                        <Link href={`/meeting/${meeting.id}`}>
                                            Ver Análisis
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
