import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { MeetingAnalysis } from "@/components/meeting-analysis";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MeetingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: meeting, error } = await supabase
        .from("meetings")
        .select("*, tasks(*)")
        .eq("id", id)
        .single();

    if (error || !meeting) {
        console.error(error);
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
                        <p className="text-muted-foreground">
                            {format(new Date(meeting.date), "PPP")}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={`/api/meeting/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                            Exportar PDF
                        </a>
                    </Button>
                </div>
            </div>

            <MeetingAnalysis meeting={meeting} tasks={meeting.tasks} />
        </div>
    );
}
