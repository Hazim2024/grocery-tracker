import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existing) {
        const fullName = data.user.user_metadata?.full_name || data.user.email || "User";
        const name = fullName.split(" ")[0];
        const colors = ["#3B82F6", "#FF6B35", "#A78BFA", "#34D399", "#F472B6", "#FBBF24"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        await supabase.from("profiles").insert({
          id: data.user.id,
          name,
          initial: name.charAt(0).toUpperCase(),
          color,
          role: "member",
        });
      }
    }
  }

  return NextResponse.redirect(new URL("/", req.url));
}