import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Список приглашений проекта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверка доступа к проекту
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Только владелец может видеть приглашения" }, { status: 403 });
    }

    // Получить pending приглашения (не принятые и не истекшие)
    const { data: invites, error } = await supabase
      .from("project_invites")
      .select("*")
      .eq("project_id", projectId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка получения приглашений:", error);
      return NextResponse.json({ error: "Не удалось получить приглашения" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invites,
    });
  } catch (error) {
    console.error("Invites GET error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// DELETE - Отменить приглашение
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверка что пользователь владелец
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Только владелец может отменять приглашения" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("inviteId");

    if (!inviteId) {
      return NextResponse.json({ error: "ID приглашения обязателен" }, { status: 400 });
    }

    // Удалить приглашение
    const { error } = await supabase
      .from("project_invites")
      .delete()
      .eq("id", inviteId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Ошибка удаления приглашения:", error);
      return NextResponse.json({ error: "Не удалось отменить приглашение" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Приглашение отменено",
    });
  } catch (error) {
    console.error("Invites DELETE error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
