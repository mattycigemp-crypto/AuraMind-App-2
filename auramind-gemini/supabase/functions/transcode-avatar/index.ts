/**
 * AuraMind Transcode Avatar — Supabase Edge Function (Deno)
 *
 * Validates a user's avatar upload in Supabase Storage and returns
 * a public URL. GIF files are passed through as-is (Supabase Storage
 * serves them natively). Raster images (PNG/JPG/WEBP) are validated
 * and returned with their dimensions.
 *
 * Deploy:
 *   supabase functions deploy transcode-avatar
 *
 * Usage (from the frontend):
 *   const res = await fetch(
 *     `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcode-avatar`,
 *     {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         Authorization: `Bearer ${session.access_token}`,
 *       },
 *       body: JSON.stringify({ userId: '...', mimeType: 'image/png' }),
 *     },
 *   );
 *   const { url, width, height } = await res.json();
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from './_shared/cors.ts';

interface TranscodeBody {
  userId: string;
  mimeType: string;
}

const SUPPORTED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const AVATAR_BUCKET = 'avatars';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: TranscodeBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.userId || !body.mimeType) {
    return new Response(
      JSON.stringify({ error: 'userId and mimeType are required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  if (!SUPPORTED_MIMES.has(body.mimeType)) {
    return new Response(
      JSON.stringify({ error: `Unsupported mimeType: ${body.mimeType}` }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const isGif = body.mimeType === 'image/gif';
  const ext = body.mimeType === 'image/jpeg' ? 'jpg' : body.mimeType.split('/')[1];
  const filePath = `${body.userId}/avatar.${ext}`;

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .download(filePath);

  if (downloadError || !fileData) {
    return new Response(
      JSON.stringify({ error: 'Avatar file not found in storage' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  if (!isGif) {
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const dims = decodeImageDimensions(bytes, body.mimeType);

    return new Response(
      JSON.stringify({
        url: urlData.publicUrl,
        width: dims.width,
        height: dims.height,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(
    JSON.stringify({
      url: urlData.publicUrl,
      width: 0,
      height: 0,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});

function decodeImageDimensions(
  bytes: Uint8Array,
  mimeType: string,
): { width: number; height: number } {
  if (mimeType === 'image/png') {
    return decodePngDimensions(bytes);
  }

  if (mimeType === 'image/jpeg') {
    return decodeJpegDimensions(bytes);
  }

  if (mimeType === 'image/webp') {
    return decodeWebpDimensions(bytes);
  }

  return { width: 0, height: 0 };
}

function decodePngDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    return { width, height };
  }
  return { width: 0, height: 0 };
}

function decodeJpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }
    offset += 2 + segmentLength;
  }
  return { width: 0, height: 0 };
}

function decodeWebpDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (
    bytes.length >= 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === 'VP8 ' && bytes.length >= 30) {
      const width = bytes[26] | (bytes[27] << 8);
      const height = bytes[28] | (bytes[29] << 8);
      return { width: width & 0x3fff, height: height & 0x3fff };
    }
    if (chunk === 'VP8L' && bytes.length >= 25) {
      const b0 = bytes[21];
      const b1 = bytes[22];
      const b2 = bytes[23];
      const b3 = bytes[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    }
    if (chunk === 'VP8X' && bytes.length >= 30) {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { width, height };
    }
  }
  return { width: 0, height: 0 };
}
