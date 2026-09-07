const videos = new Set(['/media/tour-desktop.mp4', '/media/tour-mobile.mp4']);

export default {
  async fetch(request, env) {
    if (!videos.has(new URL(request.url).pathname) || !['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    // Static Assets may ignore Range, so fetch the complete representation.
    const fullRequest = new Request(request);
    fullRequest.headers.delete('Range');
    fullRequest.headers.delete('If-Range');
    const response = await env.ASSETS.fetch(fullRequest);
    if (response.status !== 200) return response;
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    const range = request.headers.get('Range');
    const ifRange = request.headers.get('If-Range');
    const match = /^bytes=(\d*)-(\d*)$/.exec(range ?? '');
    if (request.method === 'HEAD' || !match || (!match[1] && !match[2]) ||
        (ifRange && (ifRange.startsWith('W/') || ifRange !== headers.get('ETag')))) {
      return new Response(response.body, { status: 200, headers });
    }

    // Buffer only the two bundled videos (currently under 19 MB each).
    const body = await response.arrayBuffer();
    const size = body.byteLength;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    headers.delete('Content-Encoding');
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      headers.set('Content-Range', `bytes */${size}`);
      headers.set('Content-Length', '0');
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(body.slice(start, end + 1), { status: 206, headers });
  },
};
