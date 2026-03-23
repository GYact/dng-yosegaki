import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage, deleteMessage } from "@/lib/data";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const messages = getMessages(slug ?? undefined);
  return NextResponse.json(messages);
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

    const message = addMessage({
      to: body.to,
      from: body.from,
      body: body.body,
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "メッセージの保存に失敗しました。開発環境でのみ書き込みが可能です。",
      },
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

    const deleted = deleteMessage(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "メッセージが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "削除に失敗しました。開発環境でのみ削除が可能です。" },
      { status: 500 },
    );
  }
}
