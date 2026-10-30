const PROFILE_BACKUP_KEYS = ['poeProfiles','flaskProfiles','itemProfiles','vendorProfiles','beastProfiles','scarabProfiles','essenceProfiles','tattooProfiles','runegraftProfiles','poe2_poeProfiles','poe2_vendorProfiles','poe2_tabletProfiles'];
const PROFILE_RECOVERY_KEY = 'profileBackupBeforeRestore';
interface ProfileBackup {format: 'poe-jp-regex-profiles'; version: 1; createdAt: string; profiles: Record<string, Record<string, SavedProfile>>;}
function checkBackupKeys(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [key,item] of Object.entries(value)) {
    if (['__proto__','constructor','prototype'].includes(key)) throw new Error('利用できないキーが含まれます: '+key);
    checkBackupKeys(item);
  }
}
function validateProfileBackup(value: unknown): ProfileBackup {
  checkBackupKeys(value);
  if (!storageRecord(value)||value.format!=='poe-jp-regex-profiles'||value.version!==1||!storageRecord(value.profiles)||typeof value.createdAt!=='string') throw new Error('対応するプロファイルバックアップではありません。');
  let count=0;
  for (const [key,profiles] of Object.entries(value.profiles)) {
    if (!PROFILE_BACKUP_KEYS.includes(key)||!storageRecord(profiles)||!validStoredJson(key,profiles)) throw new Error('保存内容が不正です: '+key);
    count+=Object.keys(profiles).length;
  }
  if (count>5000) throw new Error('プロファイルは一度に5000件まで復元できます。');
  return value as ProfileBackup;
}
function createProfileBackup(): ProfileBackup {
  const profiles={};
  for (const key of PROFILE_BACKUP_KEYS) {
    const raw=readStoredText(key);
    if (raw!==null) profiles[key]=JSON.parse(raw);
  }
  return validateProfileBackup({format:'poe-jp-regex-profiles',version:1,createdAt:new Date().toISOString(),profiles});
}
function restoreProfileBackup(value: unknown): {count: number; renamed: number} {
  const backup=validateProfileBackup(value);
  const previous=createProfileBackup();
  const plans: [string,string][]=[];
  let count=0,renamed=0;
  for (const [key,profiles] of Object.entries(backup.profiles)) {
    const merged=Object.assign(Object.create(null),previous.profiles[key]||{});
    for (const [name,profile] of Object.entries(profiles)) {
      let target=name,index=1;
      while (Object.prototype.hasOwnProperty.call(merged,target)) target=`${name} (復元 ${index++})`;
      if (target!==name) renamed++;
      merged[target]=profile;count++;
    }
    plans.push([key,JSON.stringify(merged)]);
  }
  if (!count) return {count,renamed};
  // Save recovery first; if quota is insufficient, do not touch any profile.
  localStorage.setItem(PROFILE_RECOVERY_KEY,JSON.stringify(previous));
  const originals=plans.map(([key])=>[key,localStorage.getItem(key)] as const);
  try { for (const [key,text] of plans) localStorage.setItem(key,text); }
  catch (error) {
    for (const [key,text] of originals) { if (text===null) localStorage.removeItem(key); else localStorage.setItem(key,text); }
    throw error;
  }
  return {count,renamed};
}
function downloadProfileBackup(backup: ProfileBackup,filename: string): void {
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
