import csv
import json

result = []
counter = 1
parents = []

with open('date_notnull_circle_pack.csv') as csvfile:
	readCSV = csv.reader(csvfile, delimiter=',')
	header = next(readCSV)
	for row in readCSV:
		parent = row[0]
		children = []
		if parent not in parents:
			child = {"name": row[3], "size": 3, "date": row[1], "tags": row[5], "major_tags": row[6], "stocksSummary": row[7], "valuation": row[8]}
			children.append(child)
			company = {"name" : parent, "children" : children,  "date": row[1], "tags": row[5], "major_tags": row[6], "stocksSummary": row[7], "valuation": row[8]}
			result.append(company)
			parents.append(parent)
		elif parent in parents:
			child = {"name": row[3], "size": 3, "date": row[1], "tags": row[5], "major_tags": row[6], "stocksSummary": row[7], "valuation": row[8]}
			for comp in result:
				if comp['name'] == parent:
					comp['children'].append(child)

print result


variant = {}
variant = {"name": "variants", "children": result}
with open('data.json', 'w') as outfile:
    json.dump(variant, outfile)