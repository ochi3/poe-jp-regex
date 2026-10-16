/** Validate the fields shared with src/types/models.d.ts before emitting JS. */
export function validateData(data, variable, source) {
  if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length) throw new Error(`Empty or invalid data dictionary: ${source}`);
  const mods=['mapModList','chartModList','tabletModList'].includes(variable);
  for(const [key,value] of Object.entries(data)) {
    if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error(`Invalid entry: ${source}: ${key}`);
    for(const field of mods?['mod','value','Regex']:['regex']) if(typeof value[field]!=='string') throw new Error(`Expected string ${field}: ${source}: ${key}`);
    for(const field of mods?['engMod','engRegex']:['engName','enRegex','chaosValue']) if(value[field]!==undefined&&typeof value[field]!=='string') throw new Error(`Expected string ${field}: ${source}: ${key}`);
    if(mods&&value.modTags!==undefined&&(!Array.isArray(value.modTags)||!value.modTags.every(tag=>tag&&typeof tag.id==='string'&&typeof tag.ja==='string'&&typeof tag.en==='string')))throw new Error('Invalid modTags: '+source+': '+key);
    if(mods&&value.reminderText!==undefined&&(!value.reminderText||!['ja','en'].every(lang=>Array.isArray(value.reminderText[lang])&&value.reminderText[lang].every(text=>typeof text==='string'))))throw new Error('Invalid reminderText: '+source+': '+key);
    if(mods&&value.sourceIds!==undefined&&(!Array.isArray(value.sourceIds)||!value.sourceIds.length||!value.sourceIds.every(id=>typeof id==='string'&&id.length))) throw new Error(`Invalid sourceIds: ${source}: ${key}`);
    if(mods&&value.tradeStatIds!==undefined&&(!Array.isArray(value.tradeStatIds)||!value.tradeStatIds.every(id=>typeof id==='string'))) throw new Error(`Invalid tradeStatIds: ${source}: ${key}`);
  }
  return data;
}
