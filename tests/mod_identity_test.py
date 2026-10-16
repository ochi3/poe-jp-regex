import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ModIdentityTests(unittest.TestCase):
    def test_actual_generators_preserve_regex_by_id_after_translation_change(self):
        for game,folder in [('poe1','tools'),('poe2','tools_poe2'),('chart','tools')]:
            with self.subTest(game=game), tempfile.TemporaryDirectory() as temp:
                work=Path(temp)
                (work/folder).mkdir()
                output=work/('poe2_scripts' if game=='poe2' else 'scripts')/('chart_mods.js' if game=='chart' else 'map_mods.js')
                output.parent.mkdir()
                previous={'旧文言': {'sourceIds':['TestMod1'],'mod':'旧文言','engMod':'Old text','value':'','Regex':'燃焼','engRegex':'burn','type':'Prefix','weight':100,'tier':1,'tradeStatIds':['explicit.123']}}
                output.write_text(('const chartModList = ' if game=='chart' else 'const mapModList = ')+json.dumps(previous,ensure_ascii=False)+';',encoding='utf-8')
                script=r'''
import sys, importlib.util
from pathlib import Path
sys.path.insert(0,sys.argv[1])
spec=importlib.util.spec_from_file_location('generator',Path(sys.argv[1])/('extract_chart_mods.py' if sys.argv[3]=='chart' else 'extract_map_mods.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.__file__=str(Path(sys.argv[2])/Path(sys.argv[1]).name/'extract_map_mods.py')
m.parse_source_arg=lambda:('repoe' if sys.argv[3]=='chart' else 'poe-db')
m.has_flag=lambda *args:True
m.fetch_trade_stat_map=lambda *args:{}
mod={'domain':'area','generation_type':'prefix','text':'Monsters burn','stats':[{'id':'test_burn','min':1,'max':1}],'spawn_weights':[{'tag':'default','weight':100}]}
if sys.argv[3]=='chart':
 mod['domain']='deepwater_chart'
 mod['spawn_weights']=[{'tag':'chart','weight':100}]
m.load_mods_and_stat_map=lambda *args:({'TestMod1':mod},{'TestMod1':{'text':'モンスターは燃焼する'}},{})
m.main()
'''
                result=subprocess.run([sys.executable,'-c',script,str(ROOT/folder),str(work),game],capture_output=True,text=True,encoding='utf-8',env={**os.environ,'PYTHONIOENCODING':'utf-8'})
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                content=output.read_text(encoding='utf-8')
                data=json.loads(content[content.index('{'):content.rindex('}')+1])
                match=next(entry for entry in data.values() if entry.get('sourceIds')==['TestMod1'])
                self.assertEqual(match['Regex'],'燃焼')
                self.assertEqual(match['engRegex'],'burn')

    def test_canonical_merge_tracks_ids_and_removes_retired_ids(self):
        spec=importlib.util.spec_from_file_location('poe2_identity_source',ROOT/'tools_poe2/poe2db_source.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        old={'old':{'sourceIds':['stable'],'mod':'old','engMod':'old','Regex':'keep','type':'Prefix','weight':100},'retired':{'sourceIds':['gone'],'mod':'retired','engMod':'retired'}}
        fresh={'new':{'sourceIds':['stable'],'mod':'new','engMod':'new','type':'Prefix','weight':200}}
        with contextlib.redirect_stdout(io.StringIO()): result=module.merge_map_mods_with_canonical(fresh,old,lambda value:value)
        self.assertNotIn('retired',result)
        self.assertEqual(result['old']['sourceIds'],['stable'])
        self.assertEqual(result['old']['mod'],'new')
        self.assertEqual(result['old']['Regex'],'keep')

if __name__ == '__main__': unittest.main()
