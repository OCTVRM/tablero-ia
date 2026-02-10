"use server";

import { createClient } from "@/lib/supabase/server";
import { parseDocx } from "@/lib/parse-docx";
import { openai } from "@/lib/openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { geminiModel } from "@/lib/gemini";

export async function analyzeMeetingAction(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Usuario no autenticado" };
    }

    const title = formData.get("title") as string;
    const dateStr = formData.get("date") as string;
    const file = formData.get("file") as File;
    const textInput = formData.get("transcript") as string;
    const provider = (formData.get("provider") as string) || "openai";

    let transcriptText = "";

    if (file && file.size > 0) {
        if (file.name.endsWith(".docx")) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                transcriptText = await parseDocx(buffer);
            } catch (e) {
                console.error("Error parsing docx:", e);
                return { error: "Error al procesar el archivo .docx" };
            }
        } else {
            return { error: "Solo se soportan archivos .docx" };
        }
    }

    if (textInput) {
        transcriptText += "\n" + textInput;
    }

    if (!transcriptText.trim()) {
        return { error: "No se encontró texto en la transcripción." };
    }

    try {
        const prompt = `
      Analiza la siguiente transcripción de una reunión de Microsoft Teams.
      El idioma de salida debe ser ESPAÑOL.
      
      Debes extraer la siguiente información en formato JSON estricto:
      {
        "summary": "Resumen ejecutivo de la reunión (párrafo corto)",
        "participants": ["Nombre 1", "Nombre 2"],
        "context": "Contexto de la reunión",
        "main_idea": "Idea principal o motivo de la reunión",
        "key_insights": ["Insight 1", "Insight 2"],
        "decisions": ["Decisión 1", "Decisión 2"],
        "risks": ["Riesgo 1", "Riesgo 2"],
        "open_questions": ["Pregunta abierta 1"],
        "pending_topics": ["Tema pendiente 1"],
        "tasks": [
          {
            "description": "Descripción de la tarea",
            "assignee": "Nombre del responsable (o 'Por definir')",
            "due_date": "YYYY-MM-DD (estimada o null)"
          }
        ]
      }

      Transcripción:
      ${transcriptText.substring(0, 50000)}
    `;

        let analysisJson: any;

        if (provider === "gemini") {
            if (!geminiModel) {
                throw new Error("Gemini API Key no configurada.");
            }
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from markdown if exists
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const cleanText = jsonMatch ? jsonMatch[0] : text;
            analysisJson = JSON.parse(cleanText);
        } else {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
            });

            const analysisContent = completion.choices[0].message.content;
            if (!analysisContent) {
                throw new Error("No response from OpenAI");
            }
            analysisJson = JSON.parse(analysisContent);
        }

        // Save to Database
        const { data: meetingData, error: meetingError } = await supabase
            .from("meetings")
            .insert({
                user_id: user.id,
                title,
                date: dateStr ? new Date(dateStr) : new Date(),
                original_transcript: transcriptText,
                analysis_json: analysisJson,
            })
            .select()
            .single();

        if (meetingError) {
            console.error("DB Error (Meeting):", meetingError);
            return { error: "Error al guardar la reunión." };
        }

        if (analysisJson.tasks && analysisJson.tasks.length > 0) {
            const tasksToInsert = analysisJson.tasks.map((task: any) => ({
                meeting_id: meetingData.id,
                description: task.description,
                assignee: task.assignee,
                due_date: task.due_date ? new Date(task.due_date) : null,
                status: "pending"
            }));

            const { error: tasksError } = await supabase
                .from("tasks")
                .insert(tasksToInsert);

            if (tasksError) {
                console.error("DB Error (Tasks):", tasksError);
                // Non-critical, meeting is saved
            }
        }

        revalidatePath("/dashboard");
        return { id: meetingData.id };

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return { error: `Error durante el análisis de IA (${provider}): ${error?.message || "Unknown error"}` };
    }
}

export async function addTaskAction(meetingId: string, description: string, assignee: string, dueDate: Date | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("tasks").insert({
        meeting_id: meetingId,
        description,
        assignee,
        due_date: dueDate,
        status: "pending"
    });

    if (error) console.error(error);
    revalidatePath(`/meeting/${meetingId}`);
    return { error: error?.message };
}

export async function updateTaskStatusAction(taskId: string, status: string, meetingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);

    if (error) console.error(error);
    revalidatePath(`/meeting/${meetingId}`);
    return { error: error?.message };
}

export async function deleteTaskAction(taskId: string, meetingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) console.error(error);
    if (error) console.error(error);
    revalidatePath(`/meeting/${meetingId}`);
    return { error: error?.message };
}

export async function regenerateAnalysisAction(meetingId: string, focus: "executive" | "technical" | "tasks") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { data: meeting } = await supabase.from("meetings").select("original_transcript").eq("id", meetingId).single();
    if (!meeting || !meeting.original_transcript) return { error: "Meeting not found or no transcript" };

    let promptFocus = "";
    switch (focus) {
        case "executive":
            promptFocus = "Enfócate en un resumen ejecutivo de alto nivel, decisiones estratégicas y riesgos de negocio. Omite detalles técnicos.";
            break;
        case "technical":
            promptFocus = "Enfócate en detalles técnicos, arquitectura, deuda técnica y decisiones de implementación. Omite generalidades de negocio.";
            break;
        case "tasks":
            promptFocus = "Enfócate EXCLUSIVAMENTE en detectar tareas, responsables y fechas. El resto de campos puede ser breve.";
            break;
    }

    try {
        const prompt = `
        Analiza la siguiente transcripción de una reunión de Microsoft Teams.
        El idioma de salida debe ser ESPAÑOL.
        
        ${promptFocus}

        Debes extraer la siguiente información en formato JSON estricto:
        {
            "summary": "Resumen",
            "participants": ["..."],
            "context": "...",
            "main_idea": "...",
            "key_insights": ["..."],
            "decisions": ["..."],
            "risks": ["..."],
            "open_questions": ["..."],
            "pending_topics": ["..."],
            "tasks": [{ "description": "...", "assignee": "...", "due_date": "..." }]
        }

        Transcripción:
        ${meeting.original_transcript.substring(0, 50000)}
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const analysisContent = completion.choices[0].message.content;
        if (!analysisContent) throw new Error("No output");
        const analysisJson = JSON.parse(analysisContent);

        await supabase.from("meetings").update({ analysis_json: analysisJson }).eq("id", meetingId);

        if (focus === "tasks" && analysisJson.tasks && analysisJson.tasks.length > 0) {
            const tasksToInsert = analysisJson.tasks.map((task: any) => ({
                meeting_id: meetingId,
                description: task.description,
                assignee: task.assignee,
                due_date: task.due_date ? new Date(task.due_date) : null,
                status: "pending"
            }));
            await supabase.from("tasks").insert(tasksToInsert);
        }

        revalidatePath(`/meeting/${meetingId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Error al regenerar análisis" };
    }
}
