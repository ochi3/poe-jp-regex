import importlib.util
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('mod_details',ROOT/'tooling/data/mod_details.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ModDetailsTests(unittest.TestCase):
    def test_tags_and_reminders_come_from_db_without_touching_regex(self):
        source={'example':{'implicit_tags':['poison','physical','chaos','attack','ailment'],'stats':[{'id':'map_curse'}]}}
        details={'tags':{'poison':{'ja':'','en':''},'physical':{'ja':'物理','en':'Physical'},'chaos':{'ja':'混沌','en':'Chaos'},'attack':{'ja':'アタック','en':'Attack'},'ailment':{'ja':'状態異常','en':'Ailment'}},'statReminders':{'map_curse':['ReminderVulnerability']},'reminders':{'ReminderVulnerability':{'ja':'ゲームから取得した説明','en':'Game reminder'}}}
        data={'key':{'sourceIds':['example'],'Regex':'手動','engRegex':'manual'}}
        module.attach_mod_details(data,source,{},details)
        result=data['key']
        self.assertEqual([tag['ja'] for tag in result['modTags']],['物理','混沌','アタック','状態異常'])
        self.assertEqual(result['reminderText']['ja'],['ゲームから取得した説明'])
        self.assertEqual(result['Regex'],'手動');self.assertEqual(result['engRegex'],'manual')
        self.assertEqual(result['reminderIds'],['ReminderVulnerability'])
if __name__=='__main__':unittest.main()
