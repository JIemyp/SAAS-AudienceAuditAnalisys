import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const type = requestUrl.searchParams.get("type");

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete(name);
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        // If this is a password recovery, redirect to reset password page
        if (!error && type === "recovery") {
            return NextResponse.redirect(new URL("/reset-password", request.url));
        }

        // If session exchange succeeded and it's a recovery type from session
        if (!error && data?.session?.user?.recovery_sent_at) {
            return NextResponse.redirect(new URL("/reset-password", request.url));
        }
    }

    // Redirect to projects page after successful auth
    return NextResponse.redirect(new URL("/projects", request.url));
}
