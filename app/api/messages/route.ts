import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  let query = supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (slug) {
    query = query.eq("to_slug", slug);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.to || !body.from || !body.body) {
      return NextResponse.json(
        { error: "to, from, body は必須です" },
        { status: 400 },
      );
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        to_slug: body.to,
        from_name: body.from,
        body: body.body,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "メッセージの保存に失敗しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
