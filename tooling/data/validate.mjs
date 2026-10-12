/** Validate the fields shared with src/types/models.d.ts before emitting JS. */
export function validateData(data, variable, source) {
  if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length) throw new Error(`Empty or invalid data dictionary: ${source}`);
  const mods=['mapModList','chartModList','tabletModList'].includes(variable);
  for(const [key,value] of Object.entries(data)) {
    if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error(`Invalid entry: ${source}: ${key}`);
    for(const field of mods?['mod','value','Regex']:['regex']) if(typeof value[field]!=='string') throw new Error(`Expected string ${field}: ${source}: ${key}`);
    for(const field of mods?['engMod','engRegex']:['engName','enRegex','chaosValue']) if(value[field]!==undefined&&typeof value[field]!=='string') throw new Error(`Expected string ${field}: ${source}: ${key}`);
    if(mods&&value.tradeStatIds!==undefined&&(!Array.isArray(value.tradeStatIds)||!value.tradeStatIds.every(id=>typeof id==='string'))) throw new Error(`Invalid tradeStatIds: ${source}: ${key}`);
  }
  return data;
}
