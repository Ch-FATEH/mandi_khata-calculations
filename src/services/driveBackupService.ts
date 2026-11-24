import { BackupPayload } from '../types/mandi';
import { validateBackupPayload } from '../utils/storage';

const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_FOLDER_NAME = 'Mandi Khata Backups';
const BACKUP_FILE_PREFIX = 'mandi-khata-backup-';

export interface DriveBackupFileMeta {
  id: string;
  name: string;
  createdTime: string;
  sizeBytes: number;
}

async function ensureBackupFolderId(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `${DRIVE_FILES_API}?q=${q}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Drive folder search failed (${searchRes.status}): ${errText}`);
  }
  const searchJson = (await searchRes.json()) as {
    files?: { id: string; name: string }[];
  };
  if (searchJson.files && searchJson.files.length > 0) {
    return searchJson.files[0].id;
  }

  const createRes = await fetch(DRIVE_FILES_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Drive folder create failed (${createRes.status}): ${errText}`);
  }
  const folder = (await createRes.json()) as { id: string };
  return folder.id;
}

export async function uploadBackupToDrive(
  accessToken: string,
  payload: BackupPayload,
  userUid: string
): Promise<DriveBackupFileMeta> {
  const folderId = await ensureBackupFolderId(accessToken);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${BACKUP_FILE_PREFIX}${stamp}.json`;
  const jsonContent = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonContent]).size;

  const boundary = `mandi_khata_${Date.now()}`;
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    appProperties: {
      app: 'mandi-khata',
      ownerUid: userUid,
    },
  };

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    jsonContent,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(
    `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,createdTime,size`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${errText}`);
  }

  const file = (await res.json()) as {
    id: string;
    name: string;
    createdTime?: string;
    size?: string;
  };

  return {
    id: file.id,
    name: file.name,
    createdTime: file.createdTime || new Date().toISOString(),
    sizeBytes: file.size ? Number(file.size) || sizeBytes : sizeBytes,
  };
}

export async function listDriveBackups(
  accessToken: string
): Promise<DriveBackupFileMeta[]> {
  const q = encodeURIComponent(
    `name contains '${BACKUP_FILE_PREFIX}' and mimeType = 'application/json' and trashed = false`
  );
  const res = await fetch(
    `${DRIVE_FILES_API}?q=${q}&orderBy=createdTime desc&pageSize=15&fields=files(id,name,createdTime,size)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive list failed (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as {
    files?: { id: string; name: string; createdTime?: string; size?: string }[];
  };
  return (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    createdTime: f.createdTime || '',
    sizeBytes: Number(f.size) || 0,
  }));
}

export async function downloadDriveBackup(
  accessToken: string,
  fileId: string
): Promise<BackupPayload> {
  const res = await fetch(`${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive download failed (${res.status}): ${errText}`);
  }
  const parsed = await res.json();
  const validated = validateBackupPayload(parsed);
  if (!validated.valid || !validated.payload) {
    throw new Error(validated.error || 'Invalid backup payload');
  }
  return validated.payload;
}
