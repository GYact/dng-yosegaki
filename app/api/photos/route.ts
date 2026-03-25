import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  let query = supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (slug) {
    query = query.eq("graduate_slug", slug);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const graduateSlug = formData.get("graduate_slug") as string | null;
    const uploadedBy = formData.get("uploaded_by") as string | null;

    if (!file || !graduateSlug || !uploadedBy) {
      return NextResponse.json(
        { error: "file, graduate_slug, uploaded_by は必須です" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `${graduateSlug}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: photo, error: insertError } = await supabase
      .from("photos")
      .insert({
        graduate_slug: graduateSlug,
        file_path: fileName,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(photo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "写真のアップロードに失敗しました" },
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

    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("file_path")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: "写真が見つかりません" },
        { status: 404 },
      );
    }

    await supabase.storage.from("photos").remove([photo.file_path]);

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
