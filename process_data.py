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
table_name = 'memory_experiment'
data_column_name = 'datastring'
# boilerplace sqlalchemy setup
engine = create_engine(db_url)
metadata = MetaData()
metadata.bind = engine
table = Table(table_name, metadata, autoload=True)
# make a query and loop through
s = table.select()
rows = s.execute()

data = []
#status codes of subjects who completed experiment
statuses = [3,4,5,7]

# if you have workers you wish to exclude, add them here
# listing all the debug ids
exclude = []

for row in rows:
    # only use subjects who completed experiment and aren't excluded
    if row['status'] in statuses and row['uniqueid'] not in exclude:
        data.append(row[data_column_name])

# Now we have all participant datastrings in a list.
# Let's make it a bit easier to work with:

# parse each participant's datastring as json object
# and take the 'data' sub-object
data = [json.loads(part)['data'] for part in data]

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
practice = {'unique_id' : [], \
	'day' : [], \
	'local_exp' : [], \
	'pos_config' : [], \
	'block_num' : [], \
	'trial_num' : [], \
	'trial_start_t' : [],\
	'trial_end_t' : [], \
	'correct_max_dist' : [], \
	'stim_dur' : [], \
	'answer_dur' : [], \
	'stim_path' : [], \
	'stim_file' : [], \
	'stim_size_x' : [], \
	'stim_size_y' : [], \
	'stim_pos_x' : [], \
	'stim_pos_y' : [], \
	'resp_pos_x' : [], \
	'resp_pos_y' : [], \
	'resp_react_t' : [], \
	'resp_result' : []}

distractor = {'unique_id' : [], \
	'problem_num' : [], \
	'literal1' : [], \
	'literal2' : [], \
	'literal3' : [], \
	'answer' : []}

nameRecall = {'unique_id' : [], \
	'answer' : []}

experiment = {'unique_id' : [], \
	'day' : [], \
	'local_exp' : [], \
	'pos_config' : [], \
	'block_num' : [], \
	'trial_num' : [], \
	'trial_start_t' : [],\
	'trial_end_t' : [], \
	'correct_max_dist' : [], \
	'stim_dur' : [], \
	'answer_dur' : [], \
	'stim_path' : [], \
	'stim_file' : [], \
	'stim_size_x' : [], \
	'stim_size_y' : [], \
	'stim_pos_x' : [], \
	'stim_pos_y' : [], \
	'resp_pos_x' : [], \
	'resp_pos_y' : [], \
	'resp_react_t' : [], \
	'resp_result' : []}

# get user experiment data
for uid in df['uniqueid'].unique():
	tmpPractice = df[(df.uniqueid == uid) & (df.phase == 'practice')][['uid', 'day', 'local_experiment', \
		'pos_conf', 'start_time', 'end_time', 'block_num', 'trial_num', 'stimulus', 'correct_max_dist', \
		'stim_dur', 'answer_dur', 'response']]

	for i in tmpPractice.index:
		practice['unique_id'].append(tmpPractice['uid'][i])
		practice['day'].append(int(tmpPractice['day'][i]))
		practice['local_exp'].append(tmpPractice['local_experiment'][i])
		practice['pos_config'].append(tmpPractice['pos_conf'][i])
		practice['block_num'].append(int(tmpPractice['block_num'][i]))
		practice['trial_num'].append(int(tmpPractice['trial_num'][i]))
		practice['trial_start_t'].append(int(tmpPractice['start_time'][i]))
		practice['trial_end_t'].append(int(tmpPractice['end_time'][i]))
		practice['correct_max_dist'].append(int(tmpPractice['correct_max_dist'][i]))
		practice['stim_dur'].append(int(tmpPractice['stim_dur'][i]))
		practice['answer_dur'].append(int(tmpPractice['answer_dur'][i]))
		practice['stim_path'].append(tmpPractice['stimulus'][i]['path'])
		practice['stim_file'].append(tmpPractice['stimulus'][i]['filename'])
		practice['stim_size_x'].append(tmpPractice['stimulus'][i]['size']['x'])
		practice['stim_size_y'].append(tmpPractice['stimulus'][i]['size']['y'])
		practice['stim_pos_x'].append(int(tmpPractice['stimulus'][i]['pos']['x']))
		practice['stim_pos_y'].append(int(tmpPractice['stimulus'][i]['pos']['y']))
		practice['resp_pos_x'].append(tmpPractice['response'][i]['position']['x'])
		practice['resp_pos_y'].append(tmpPractice['response'][i]['position']['y'])
		practice['resp_react_t'].append(tmpPractice['response'][i]['react_time'])
		practice['resp_result'].append(tmpPractice['response'][i]['result'])

	# need to prune records where problem == NaN
	tmpDistractor = df[(df.uniqueid == uid) & (df.phase == 'distractortask')][['uid', 'problem', 'literal1', 'literal2', 'literal3', 'answer']]

	for d in tmpDistractor.index:
		if not isnan(tmpDistractor['answer'][d]):
			distractor['unique_id'].append(tmpDistractor['uid'][d])
			distractor['problem_num'].append(int(tmpDistractor['problem'][d]))
			distractor['literal1'].append(int(tmpDistractor['literal1'][d]))
			distractor['literal2'].append(int(tmpDistractor['literal2'][d]))
			distractor['literal3'].append(int(tmpDistractor['literal3'][d]))
			distractor['answer'].append(int(tmpDistractor['answer'][d]))
	
	# need to prune records where answer == NaN
	tmpNameRecall = df[(df.uniqueid == uid) & (df.phase == 'namerecalltask')][['uid', 'answer']]

	for n in tmpNameRecall.index:
		if not isnan(tmpNameRecall['answer'][n]):
			nameRecall['unique_id'].append(tmpNameRecall['uid'][n])
			nameRecall['answer'].append(tmpNameRecall['answer'][n])

	tmpExperiment = df[(df.uniqueid == uid) & (df.phase == 'realexperiment')][['uid', 'day', 'local_experiment', \
		'pos_conf', 'start_time', 'end_time', 'block_num', 'trial_num', 'stimulus', 'correct_max_dist', \
		'stim_dur', 'answer_dur', 'response']]

	for e in tmpExperiment.index:
		experiment['unique_id'].append(tmpExperiment['uid'][e])
		experiment['day'].append(int(tmpExperiment['day'][e]))
		experiment['local_exp'].append(tmpExperiment['local_experiment'][e])
		experiment['pos_config'].append(tmpExperiment['pos_conf'][e])
		experiment['block_num'].append(int(tmpExperiment['block_num'][e]))
		experiment['trial_num'].append(int(tmpExperiment['trial_num'][e]))
		experiment['trial_start_t'].append(int(tmpExperiment['start_time'][e]))
		experiment['trial_end_t'].append(int(tmpExperiment['end_time'][e]))
		experiment['correct_max_dist'].append(int(tmpExperiment['correct_max_dist'][e]))
		experiment['stim_dur'].append(int(tmpExperiment['stim_dur'][e]))
		experiment['answer_dur'].append(int(tmpExperiment['answer_dur'][e]))
		experiment['stim_path'].append(tmpExperiment['stimulus'][e]['path'])
		experiment['stim_file'].append(tmpExperiment['stimulus'][e]['filename'])
		experiment['stim_size_x'].append(tmpExperiment['stimulus'][e]['size']['x'])
		experiment['stim_size_y'].append(tmpExperiment['stimulus'][e]['size']['y'])
		experiment['stim_pos_x'].append(int(tmpExperiment['stimulus'][e]['pos']['x']))
		experiment['stim_pos_y'].append(int(tmpExperiment['stimulus'][e]['pos']['y']))
		experiment['resp_pos_x'].append(tmpExperiment['response'][e]['position']['x'])
		experiment['resp_pos_y'].append(tmpExperiment['response'][e]['position']['y'])
		experiment['resp_react_t'].append(tmpExperiment['response'][e]['react_time'])
		experiment['resp_result'].append(tmpExperiment['response'][e]['result'])


# create data frames out of our arrays so we can easily export the data to CSV
practiceDF = pd.DataFrame(practice, columns=['unique_id', 'day', 'local_exp', 'pos_config', \
	'block_num', 'trial_num', 'trial_start_t', 'trial_end_t', 'correct_max_dist', 'stim_dur', 'answer_dur', \
	'stim_path', 'stim_file', 'stim_size_x', 'stim_size_y', 'stim_pos_x', \
	'stim_pos_y', 'resp_pos_x', 'resp_pos_y', 'resp_result', 'resp_react_t'])
distractorDF = pd.DataFrame(distractor, columns=['unique_id', 'problem_num', 'literal1', 'literal2', 'literal3', 'answer'])
nameRecallDF = pd.DataFrame(nameRecall, columns=['unique_id', 'answer'])
experimentDF = pd.DataFrame(experiment, columns=['unique_id', 'day', 'local_exp', 'pos_config', \
	'block_num', 'trial_num', 'trial_start_t', 'trial_end_t', 'correct_max_dist', 'stim_dur', 'answer_dur', \
	'stim_path', 'stim_file', 'stim_size_x', 'stim_size_y', 'stim_pos_x', \
	'stim_pos_y', 'resp_pos_x', 'resp_pos_y', 'resp_result', 'resp_react_t'])

# export data to csv files
practiceDF.to_csv('data_practice_task.csv')
distractorDF.to_csv('data_distractor_task.csv')
nameRecallDF.to_csv('data_name_recall_task.csv')
experimentDF.to_csv('data_real_experiment_task.csv')

## WE ARE DONE!