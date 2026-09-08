import fs from 'fs';
const API = 'https://open.tiktokapis.com/v2/post/publish';
async function initialize(accessToken, path, payload) {
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || result.error?.code !== 'ok' || !result.data?.upload_url) throw new Error(result.error?.message || 'TikTok video initialization failed.');
  return result.data;
}
async function uploadFile(uploadUrl, file) {
  const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.mimetype || 'video/mp4', 'Content-Length': String(file.size), 'Content-Range': `bytes 0-${file.size - 1}/${file.size}` }, body: fs.createReadStream(file.path), duplex: 'half' });
  if (!response.ok) throw new Error('TikTok video upload failed.');
}
export async function uploadDraft(accessToken, file) {
  const data = await initialize(accessToken, '/inbox/video/init/', { source_info: { source: 'FILE_UPLOAD', video_size: file.size, chunk_size: file.size, total_chunk_count: 1 } });
  await uploadFile(data.upload_url, file);
  return data.publish_id;
}
export async function publishVideo(accessToken, file, postInfo) {
  const data = await initialize(accessToken, '/video/init/', { post_info: postInfo, source_info: { source: 'FILE_UPLOAD', video_size: file.size, chunk_size: file.size, total_chunk_count: 1 } });
  await uploadFile(data.upload_url, file);
  return data.publish_id;
}