import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Принять приглашение по токену
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Необходимо войти в систему" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Токен приглашения обязателен" }, { status: 400 });
    }

    // Найти приглашение по токену
    const { data: invite, error: inviteError } = await supabase
      .from("project_invites")
      .select("*, projects(id, name)")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Приглашение не найдено" }, { status: 404 });
    }

    // Проверить не истекло ли приглашение
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Приглашение истекло" }, { status: 400 });
    }

    // Проверить не было ли уже принято
    if (invite.accepted_at) {
      return NextResponse.json({ error: "Приглашение уже принято" }, { status: 400 });
    }

    // Проверить email (если совпадает)
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({
        error: `Это приглашение для ${invite.email}. Войдите с правильным аккаунтом.`
      }, { status: 403 });
    }

    // Проверить не является ли пользователь уже участником
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", invite.project_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "Вы уже участник этого проекта" }, { status: 400 });
    }

    // Проверить не является ли пользователь владельцем
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", invite.project_id)
      .single();

    if (project?.user_id === user.id) {
      return NextResponse.json({ error: "Вы являетесь владельцем этого проекта" }, { status: 400 });
    }

    // Создать запись участника
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by,
      });

    if (memberError) {
      console.error("Ошибка создания участника:", memberError);
      return NextResponse.json({ error: "Не удалось принять приглашение" }, { status: 500 });
    }

    // Отметить приглашение как принятое
    const { error: updateError } = await supabase
      .from("project_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Ошибка обновления приглашения:", updateError);
    }

    // projects can be an array or single object depending on Supabase config
    const projectsRaw = invite.projects as unknown;
    const projectObj = Array.isArray(projectsRaw) ? projectsRaw[0] : projectsRaw;
    const projectInfo = projectObj as { id: string; name: string } | undefined;

    return NextResponse.json({
      success: true,
      message: "Приглашение принято",
      projectId: invite.project_id,
      projectName: projectInfo?.name || "Проект",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// GET - Получить информацию о приглашении по токену (для страницы принятия)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Токен обязателен" }, { status: 400 });
    }

    const supabase = await createClient();

    // Найти приглашение
    const { data: invite, error } = await supabase
      .from("project_invites")
      .select("id, email, role, expires_at, accepted_at, projects(id, name)")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Приглашение не найдено" }, { status: 404 });
    }

    // Проверить статус
    const isExpired = new Date(invite.expires_at) < new Date();
    const isAccepted = !!invite.accepted_at;

    // projects can be an array or single object depending on Supabase config
    const projectsData = invite.projects as unknown;
    const projectData = Array.isArray(projectsData) ? projectsData[0] : projectsData;
    const projectInfo = projectData as { id: string; name: string } | undefined;

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        projectName: projectInfo?.name || "Проект",
        projectId: projectInfo?.id,
        isExpired,
        isAccepted,
      },
    });
  } catch (error) {
    console.error("Get invite error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
