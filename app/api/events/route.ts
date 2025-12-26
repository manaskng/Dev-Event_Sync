import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const image = formData.get("image");

    // 🔒 HARD VALIDATION
    if (!(image instanceof Blob)) {
      return NextResponse.json(
        { message: "Image must be uploaded as a file (multipart/form-data)" },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // ✅ Convert file → base64 (Edge-safe, Cache-safe)
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const dataUri = `data:${image.type};base64,${base64}`;

    // ✅ Cloudinary upload (base64)
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "DevEvent",
    });

    // Parse structured fields
    const tags = JSON.parse(formData.get("tags") as string);
    const agenda = JSON.parse(formData.get("agenda") as string);

    const eventData = Object.fromEntries(formData.entries());

    const createdEvent = await Event.create({
      ...eventData,
      image: uploadResult.secure_url,
      tags,
      agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { message: "Event creation failed", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
        console.log("MONGODB_URI exists?", !!process.env.MONGODB_URI);

        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
  console.error("🔥 FULL GET /api/events ERROR 🔥");
  console.error(e);

  if (e instanceof Error) {
    console.error("Error name:", e.name);
    console.error("Error message:", e.message);
    console.error("Stack:", e.stack);
  }

  return NextResponse.json(
    {
      message: "Event fetching failed",
      error: e instanceof Error ? e.message : e,
    },
    { status: 500 }
  );
}
}
