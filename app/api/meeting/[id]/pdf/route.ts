import { createClient } from "@/lib/supabase/server";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: meeting, error } = await supabase
        .from("meetings")
        .select("*, tasks(*)")
        .eq("id", id)
        .single();

    if (error || !meeting) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const analysis = meeting.analysis_json;

    // Create a PDF document
    const doc = new PDFDocument();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Pipe PDFKit output to the stream
    doc.on('data', (chunk) => writer.write(chunk));
    doc.on('end', () => writer.close());

    // PDF Content Generation
    doc.fontSize(20).text(meeting.title, { align: 'center' });
    doc.fontSize(12).text(new Date(meeting.date).toLocaleDateString(), { align: 'center' });
    doc.moveDown();

    if (analysis) {
        doc.fontSize(16).text('Resumen Ejecutivo');
        doc.fontSize(12).text(analysis.summary);
        doc.moveDown();

        if (analysis.tasks && analysis.tasks.length > 0) {
            doc.fontSize(16).text('Tareas Detectadas');
            analysis.tasks.forEach((task: any) => {
                doc.fontSize(12).text(`- ${task.description} (${task.assignee || 'Sin asignar'})`);
            });
            doc.moveDown();
        }

        if (analysis.decisions && analysis.decisions.length > 0) {
            doc.fontSize(16).text('Decisiones');
            analysis.decisions.forEach((item: string) => {
                doc.fontSize(12).text(`- ${item}`);
            });
            doc.moveDown();
        }

        if (analysis.risks && analysis.risks.length > 0) {
            doc.fontSize(16).text('Riesgos');
            analysis.risks.forEach((item: string) => {
                doc.fontSize(12).text(`- ${item}`);
            });
            doc.moveDown();
        }
    } else {
        doc.text("Análisis no disponible.");
    }

    doc.end();

    return new NextResponse(stream.readable, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
        },
    });
}
