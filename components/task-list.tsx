"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { addTaskAction, updateTaskStatusAction, deleteTaskAction } from "@/app/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Task = {
    id: string;
    description: string;
    assignee: string | null;
    due_date: string | null;
    status: string;
    meeting_id: string;
};

export function TaskList({ tasks, meetingId }: { tasks: Task[], meetingId: string }) {
    const [newTask, setNewTask] = useState("");
    const [assignee, setAssignee] = useState("");
    const [date, setDate] = useState<Date | undefined>();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        setIsAdding(true);
        await addTaskAction(meetingId, newTask, assignee || "Por definir", date || null);
        setNewTask("");
        setAssignee("");
        setDate(undefined);
        setIsAdding(false);
    };

    const toggleTask = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        await updateTaskStatusAction(taskId, newStatus, meetingId);
    };

    const handleDelete = async (taskId: string) => {
        if (confirm("¿Estás seguro de eliminar esta tarea?")) {
            await deleteTaskAction(taskId, meetingId);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/20">
                <h4 className="font-medium text-sm">Agregar Nueva Tarea</h4>
                <div className="flex gap-2">
                    <Input
                        placeholder="Descripción de la tarea..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <Input
                        placeholder="Responsable"
                        className="w-[150px]"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[40px] px-0 justify-center",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleAddTask} disabled={isAdding || !newTask.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-muted/10 p-2 rounded transition-colors group">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                checked={task.status === "completed"}
                                onCheckedChange={() => toggleTask(task.id, task.status)}
                                className="mt-1"
                            />
                            <div>
                                <p className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                                    {task.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {task.assignee} {task.due_date && `• ${new Date(task.due_date).toLocaleDateString()}`}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(task.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
