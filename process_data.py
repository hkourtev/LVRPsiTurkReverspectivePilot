from sqlalchemy import create_engine, MetaData, Table
import json
import pandas as pd

def isnan(value):
  try:
      import math
      return math.isnan(float(value))
  except:
      return False

db_file_name = raw_input("Please type the DB name: ")
db_url = 'sqlite:///' + db_file_name
table_name = 'reverspective_pilot'
data_column_name = 'datastring'
# boilerplace sqlalchemy setup
engine = create_engine(db_url)
metadata = MetaData()
metadata.bind = engine
table = Table(table_name, metadata, autoload=True)
# make a query and loop through
s = table.select()
rows = s.execute()

raw_data = []
data = []
questiondata = []


#status codes of subjects who completed experiment
statuses = [3,4,5,7]

# if you have workers you wish to exclude, add them here
# listing all the debug ids
exclude = []

for row in rows:
    # only use subjects who completed experiment and aren't excluded
    if row['status'] in statuses and row['uniqueid'] not in exclude:
        raw_data.append(row[data_column_name])

# Now we have all participant datastrings in a list.
# Let's make it a bit easier to work with:

# parse each participant's datastring as json object
# and take the 'data' sub-object
data = [json.loads(part)['data'] for part in raw_data]

# insert uniqueid field into trialdata in case it wasn't added
# in experiment:
for part in data:
    for record in part:
        record['trialdata']['uniqueid'] = record['uniqueid']

# flatten nested list so we just have a list of the trialdata recorded
# each time psiturk.recordTrialData(trialdata) was called.
data = [record['trialdata'] for part in data for record in part]

# Put all subjects' trial data into a dataframe object from the
# 'pandas' python library: one option among many for analysis
df = pd.DataFrame(data)

# create arrays which will store data and will be writen to tables later on (possibly)
experiment = {'unique_id' : [], \
	'phase' : [], \
	'trial' : [], \
	'stim_name' : [], \
	'stim_light_color' : [], \
	'stim_rot_init_ang' : [], \
	'stim_rot_init_dir' : [], \
	'stim_rot_max_speed' : [], \
	'stim_rot_min_speed' : [], \
	'stim_rot_max_ang' : [], \
	'stim_good_size' : [], \
	'stim_distance' : [], \
	'stim_file_name' : [], \
	'stim_tex_file_name' : [], \
	'stim_mtl_shin' : [], \
	'stim_rot_num_change_dir' : [], \
	'stim_center' : [], \
	'stim_size' : [], \
	'stim_scaling' : [], \
	'dots_green_pos' : [], \
	'dots_red_pos' : [], \
	'dots_color_flipped' : [], \
	'dots_green_radius' : [], \
	'dots_red_radius' : [], \
	'dots_green_radius_big' : [], \
	'dots_red_radius_big' : [], \
	'dots_red_is_big' : [], \
	'dots_jitter_on' : [], \
	'dots_green_jitter' : [], \
	'dots_red_jitter' : [], \
	'dots_onset_degree' : [], \
	'resp_given' : [], \
	'resp_correct' : [], \
	'resp_reaction_time' : []
}

# get user experiment data
for uid in df['uniqueid'].unique():
	tmpExperiment = df[((df.uniqueid == uid) & (df.phase == 'part1')) | \
		((df.uniqueid == uid) & (df.phase == 'part2a')) | ((df.uniqueid == uid) & (df.phase == 'part2b'))][['phase', 'trial', \
		'stim_name', 'stim_light_color', 'stim_rot_init_ang', 'stim_rot_init_dir', \
		'stim_rot_max_speed', 'stim_rot_min_speed', 'stim_rot_max_ang', 'stim_good_size', \
		'stim_distance', 'stim_file_name', 'stim_tex_file_name', 'stim_mtl_shin', \
		'stim_rot_num_change_dir', 'stim_center', 'stim_size', 'stim_scaling', \
		'dots_green_pos', 'dots_red_pos', 'dots_color_flipped', 'dots_green_radius', \
		'dots_red_radius', 'dots_green_radius_big', 'dots_red_radius_big', \
		'dots_red_is_big', 'dots_jitter_on', 'dots_green_jitter', 'dots_red_jitter', \
		'dots_onset_degree', 'resp_given', 'resp_correct', 'resp_reaction_time' ]]

	for e in tmpExperiment.index:
		experiment['unique_id'].append(uid)
		experiment['phase'].append(tmpExperiment['phase'][e])
		experiment['trial'].append(int(tmpExperiment['trial'][e]))
		experiment['stim_name'].append(tmpExperiment['stim_name'][e])
		experiment['stim_light_color'].append(tmpExperiment['stim_light_color'][e])
		experiment['stim_rot_init_ang'].append(tmpExperiment['stim_rot_init_ang'][e])
		experiment['stim_rot_init_dir'].append(tmpExperiment['stim_rot_init_dir'][e])
		experiment['stim_rot_max_speed'].append(tmpExperiment['stim_rot_max_speed'][e])
		experiment['stim_rot_min_speed'].append(tmpExperiment['stim_rot_min_speed'][e])
		experiment['stim_rot_max_ang'].append(tmpExperiment['stim_rot_max_ang'][e])
		experiment['stim_good_size'].append(tmpExperiment['stim_good_size'][e])
		experiment['stim_distance'].append(tmpExperiment['stim_distance'][e])
		experiment['stim_file_name'].append(tmpExperiment['stim_file_name'][e])
		experiment['stim_tex_file_name'].append(tmpExperiment['stim_tex_file_name'][e])
		experiment['stim_mtl_shin'].append(tmpExperiment['stim_mtl_shin'][e])
		experiment['stim_rot_num_change_dir'].append(tmpExperiment['stim_rot_num_change_dir'][e])
		experiment['stim_center'].append(tmpExperiment['stim_center'][e])
		experiment['stim_size'].append(tmpExperiment['stim_size'][e])
		experiment['stim_scaling'].append(tmpExperiment['stim_scaling'][e])
		experiment['dots_green_pos'].append(tmpExperiment['dots_green_pos'][e])
		experiment['dots_red_pos'].append(tmpExperiment['dots_red_pos'][e])
		experiment['dots_color_flipped'].append(tmpExperiment['dots_color_flipped'][e])
		experiment['dots_green_radius'].append(tmpExperiment['dots_green_radius'][e])
		experiment['dots_red_radius'].append(tmpExperiment['dots_red_radius'][e])
		experiment['dots_green_radius_big'].append(tmpExperiment['dots_green_radius_big'][e])
		experiment['dots_red_radius_big'].append(tmpExperiment['dots_red_radius_big'][e])
		experiment['dots_red_is_big'].append(tmpExperiment['dots_red_is_big'][e])
		experiment['dots_jitter_on'].append(tmpExperiment['dots_jitter_on'][e])
		experiment['dots_green_jitter'].append(tmpExperiment['dots_green_jitter'][e])
		experiment['dots_red_jitter'].append(tmpExperiment['dots_red_jitter'][e])
		experiment['dots_onset_degree'].append(tmpExperiment['dots_onset_degree'][e])
		experiment['resp_given'].append(tmpExperiment['resp_given'][e])
		experiment['resp_correct'].append(tmpExperiment['resp_correct'][e])
		experiment['resp_reaction_time'].append(tmpExperiment['resp_reaction_time'][e])
		
		
# create data frames out of our arrays so we can easily export the data to CSV
experimentDF = pd.DataFrame(experiment, columns=['unique_id', 'phase', 'trial', \
		'stim_name', 'stim_light_color', 'stim_rot_init_ang', 'stim_rot_init_dir', \
		'stim_rot_max_speed', 'stim_rot_min_speed', 'stim_rot_max_ang', 'stim_good_size', \
		'stim_distance', 'stim_file_name', 'stim_tex_file_name', 'stim_mtl_shin', \
		'stim_rot_num_change_dir', 'stim_center', 'stim_size', 'stim_scaling', \
		'dots_green_pos', 'dots_red_pos', 'dots_color_flipped', 'dots_green_radius', \
		'dots_red_radius', 'dots_green_radius_big', 'dots_red_radius_big', \
		'dots_red_is_big', 'dots_jitter_on', 'dots_green_jitter', 'dots_red_jitter', \
		'dots_onset_degree', 'resp_given', 'resp_correct', 'resp_reaction_time'])

# export data to csv files
experimentDF.to_csv('trial_data.csv')

# now the PDI questionnaire answers
# create arrays which will store data and will be writen to tables later on (possibly)
pdi = {'unique_id' : [], 'ans1' : [], 'ans2' : [], 'ans3' : [], 'ans4' : []}

# get user experiment data
for uid in df['uniqueid'].unique():
	tmpPDI = df[((df.uniqueid == uid) & (df.phase == 'pdi'))][['pdi_q_1', 'pdi_q_2', 'pdi_q_3', 'pdi_q_4', 'pdi_q_5', \
		'pdi_q_6', 'pdi_q_7', 'pdi_q_8', 'pdi_q_9', 'pdi_q_10', 'pdi_q_11', 'pdi_q_12', \
		'pdi_q_13', 'pdi_q_14', 'pdi_q_15', 'pdi_q_16', 'pdi_q_17', 'pdi_q_18', \
		'pdi_q_19', 'pdi_q_20', 'pdi_q_21']]

	for e in tmpPDI.index:
		res_size = tmpPDI.shape;
		for j in range(res_size[1]):
			pdi['unique_id'].append(uid)
			pdi['ans1'].append(tmpPDI['pdi_q_' + str(j+1)][e][0])
			pdi['ans2'].append(tmpPDI['pdi_q_' + str(j+1)][e][1])
			pdi['ans3'].append(tmpPDI['pdi_q_' + str(j+1)][e][2])
			pdi['ans4'].append(tmpPDI['pdi_q_' + str(j+1)][e][3])

		
# create data frames out of our arrays so we can easily export the data to CSV
pdiDF = pd.DataFrame(pdi, columns=['unique_id', 'ans1', 'ans2', 'ans3', 'ans4'])

# export data to csv files
pdiDF.to_csv('pdi_questionnaire_data.csv')



# ------------ NOW UNSTRUCTURED/QUESTION DATA ----------------
# flatten nested list so we just have a list of the unstructured data recorded
# each time psiturk.recordUnstructuredData(id, val) was called.
# questiondata (where the rules are stored)
questiondata = [json.loads(part)['questiondata'] for part in raw_data]

# Put all subjects' trial data into a dataframe object from the
# 'pandas' python library: one option among many for analysis
rules_df = pd.DataFrame(questiondata)

# create arrays which will store data and will be writen to tables later on (possibly)
rules = {'unique_id' : [], \
	'rule_desc' : [], \
	'other_rules_desc' : []}

# get user experiment data
for uid in rules_df['uniqueid'].unique():
	tmpRules = rules_df[rules_df.uniqueid == uid][['rule_desc', 'other_rules_desc']]

	for e in tmpRules.index:
		rules['unique_id'].append(uid)
		rules['rule_desc'].append(tmpRules['rule_desc'][e])
		rules['other_rules_desc'].append(tmpRules['other_rules_desc'][e])
		
# create data frames out of our arrays so we can easily export the data to CSV
rulesDF = pd.DataFrame(rules, columns=['unique_id', 'rule_desc', 'other_rules_desc'])

# export data to csv files
rulesDF.to_csv('rules_data.csv')

## WE ARE DONE!