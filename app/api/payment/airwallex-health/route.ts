import { NextResponse } from "next/server";

export async function GET() {
  const configured = !!(process.env.AIRWALLEX_CLIENT_ID && process.env.AIRWALLEX_API_KEY);
  return NextResponse.json({ configured });
}
