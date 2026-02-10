import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Login({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>;
}) {
    const params = await searchParams;

    const signIn = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = await createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login Error:", error.message, error.status);
            return redirect(`/login?message=${encodeURIComponent(error.message)}`);
        }

        return redirect("/");
    };

    const signUp = async (formData: FormData) => {
        "use server";

        const origin = (await headers()).get("origin");
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = await createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("SignUp Error:", error.message, error.status);
            return redirect(`/login?message=${encodeURIComponent(error.message)}`);
        }

        return redirect("/login?message=Revisa tu email para confirmar el registro");
    };

    // Note: For Google Auth, we'd need a client component or a server action that redirects to the provider URL.
    // For simplicity here, we can add a placeholder or implement it if keys are provided.

    return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-muted/30">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Bienvenido
                    </CardTitle>
                    <CardDescription>
                        Inicia sesión para analizar tus reuniones
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" action={signIn}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        {params?.message && (
                            <p className="text-sm font-medium text-red-500 text-center">
                                {params.message}
                            </p>
                        )}
                        <div className="flex flex-col gap-2">
                            <Button type="submit" className="w-full">
                                Iniciar Sesión
                            </Button>
                            <Button formAction={signUp} variant="outline" className="w-full">
                                Registrarse
                            </Button>
                        </div>
                    </form>

                    <Separator className="my-4" />

                    {/* <Button variant="secondary" className="w-full" disabled>
            Continuar con Google (Requiere configuración)
          </Button> */}
                </CardContent>
            </Card>
        </div>
    );
}
